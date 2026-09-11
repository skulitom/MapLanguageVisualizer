import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, PointerEvent, ReactNode } from 'react';
import { geoGraticule10, geoNaturalEarth1, geoPath } from 'd3-geo';
import type { GeoPermissibleObjects } from 'd3-geo';
import { select } from 'd3-selection';
import 'd3-transition';
import { zoom, zoomIdentity, zoomTransform } from 'd3-zoom';
import type { D3ZoomEvent, ZoomBehavior, ZoomTransform } from 'd3-zoom';
import type { CountryFill, FocusRequest, MapCountry } from '../../types';
import { fillPaint } from '../../utils/colorScales';
import type { StripeFill } from '../../utils/colorScales';
import { largestPart } from '../../utils/geography';
import { MinusIcon, PlusIcon, ResetIcon } from '../icons';
import Tooltip from './Tooltip';

type Extent = [[number, number], [number, number]];
type ZoomEvent = D3ZoomEvent<SVGSVGElement, unknown>;

/** Parts of the map area covered by other UI; the world is fitted into the rest. */
export interface MapInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const SPHERE: GeoPermissibleObjects = { type: 'Sphere' };
const GRATICULE = geoGraticule10();
const FIT_PADDING = 12;
const MAX_ZOOM = 12;
const DOT_RADIUS = 3.5;
const DOT_HIT_RADIUS = 11;
const STRIPE_WIDTH = 2.4;
const PAN_STEP = 80;
/** On small screens the map opens zoomed in to fill the view, centred on Europe and Africa. */
const COVER_CENTER: [number, number] = [20, 15];
const COVER_MAX_ZOOM = 3.5;
const PAN_KEYS: Record<string, [number, number] | undefined> = {
  ArrowLeft: [1, 0],
  ArrowRight: [-1, 0],
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
};

interface Shape {
  key: string;
  d: string;
}

interface Dot {
  key: string;
  x: number;
  y: number;
}

interface HoverState {
  key: string;
  x: number;
  y: number;
  flipX: boolean;
  flipY: boolean;
}

interface WorldMapProps {
  countries: MapCountry[];
  countriesByKey: Map<string, MapCountry>;
  fills: Map<string, CountryFill>;
  stripes: StripeFill[];
  width: number;
  height: number;
  insets: MapInsets;
  /** Extra room to leave on the right when framing a country (the floating country card). */
  focusInsetRight: number;
  /** Open zoomed in so the world fills the view (cropping it) instead of sitting in empty bands. */
  cover: boolean;
  selectedKey: string | null;
  focusRequest: FocusRequest | null;
  onSelect: (key: string | null) => void;
  renderTooltip: (country: MapCountry) => ReactNode;
}

/** Country outlines only change with the projection; zooming just transforms their group. */
const CountryShapes = memo(function CountryShapes({
  shapes,
  fills,
}: {
  shapes: Shape[];
  fills: Map<string, CountryFill>;
}) {
  return (
    <g className="countries">
      {shapes.map(({ key, d }) => (
        <path key={key} d={d} data-key={key} fill={fillPaint(fills.get(key))} />
      ))}
    </g>
  );
});

function keyAt(target: EventTarget): string | null {
  return target instanceof Element ? (target.closest('[data-key]')?.getAttribute('data-key') ?? null) : null;
}

function motionDuration(ms: number): number {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms;
}

export default function WorldMap({
  countries,
  countriesByKey,
  fills,
  stripes,
  width,
  height,
  insets,
  focusInsetRight,
  cover,
  selectedKey,
  focusRequest,
  onSelect,
  renderTooltip,
}: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const viewRef = useRef<{ center: [number, number]; k: number } | null>(null);
  const handledFocus = useRef<number | null>(null);
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);
  const [hover, setHover] = useState<HoverState | null>(null);
  const [gesturing, setGesturing] = useState(false);

  const { top, right, bottom, left } = insets;
  const viewport = useMemo<Extent>(
    () => [
      [left, top],
      [width - right, height - bottom],
    ],
    [width, height, top, right, bottom, left]
  );

  const projection = useMemo(() => {
    const [[x0, y0], [x1, y1]] = viewport;
    return geoNaturalEarth1().fitExtent(
      [
        [x0 + FIT_PADDING, y0 + FIT_PADDING],
        [x1 - FIT_PADDING, y1 - FIT_PADDING],
      ],
      SPHERE
    );
  }, [viewport]);

  const path = useMemo(() => geoPath(projection), [projection]);

  // Panning stops at the edge of the globe.
  const frame = useMemo(() => {
    const translateExtent: Extent = path.bounds(SPHERE);
    return { sphere: path(SPHERE) ?? '', graticule: path(GRATICULE) ?? '', translateExtent };
  }, [path]);

  const shapes = useMemo<Shape[]>(
    () =>
      countries.flatMap((country) => {
        if (!country.feature) return [];
        const d = path(country.feature as unknown as GeoPermissibleObjects);
        return d ? [{ key: country.key, d }] : [];
      }),
    [countries, path]
  );
  const shapeByKey = useMemo(() => new Map(shapes.map((shape) => [shape.key, shape])), [shapes]);

  const dots = useMemo<Dot[]>(
    () =>
      countries.flatMap((country) => {
        const xy = country.point ? projection(country.point) : null;
        return xy ? [{ key: country.key, x: xy[0], y: xy[1] }] : [];
      }),
    [countries, projection]
  );

  const initialView = useMemo(() => {
    if (!cover) return zoomIdentity;
    const [[x0, y0], [x1, y1]] = frame.translateExtent;
    const [[vx0, vy0], [vx1, vy1]] = viewport;
    const k = Math.min(COVER_MAX_ZOOM, Math.max((vx1 - vx0) / (x1 - x0), (vy1 - vy0) / (y1 - y0)));
    const center = projection(COVER_CENTER);
    if (k <= 1.05 || !center) return zoomIdentity;
    // Constraining to the globe then pins whichever axis now fits exactly.
    return zoomIdentity.translate((vx0 + vx1) / 2 - center[0] * k, (vy0 + vy1) / 2 - center[1] * k).scale(k);
  }, [cover, frame, viewport, projection]);

  // Pan and zoom: wheel, drag, pinch, double-click / double-tap.
  useLayoutEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;
    const svg = select(svgElement);
    const [[vx0, vy0], [vx1, vy1]] = viewport;
    const viewportCenter: [number, number] = [(vx0 + vx1) / 2, (vy0 + vy1) / 2];

    const behavior = zoom<SVGSVGElement, unknown>()
      .extent(viewport)
      .translateExtent(frame.translateExtent)
      .scaleExtent([1, MAX_ZOOM])
      .clickDistance(4)
      .on('start', (event: ZoomEvent) => {
        if (!event.sourceEvent) return;
        setGesturing(true);
        setHover(null);
      })
      .on('zoom', (event: ZoomEvent) => {
        setTransform(event.transform);
        const center = projection.invert?.(event.transform.invert(viewportCenter));
        if (center) viewRef.current = { center: [center[0], center[1]], k: event.transform.k };
      })
      .on('end', () => setGesturing(false));

    svg.call(behavior);
    zoomRef.current = behavior;

    // Keep the same place in view across resizes; the first time, start from the initial view.
    let target = initialView;
    const previous = viewRef.current;
    const previousCenter = previous ? projection(previous.center) : null;
    if (previous && previousCenter) {
      target = zoomIdentity
        .translate(viewportCenter[0] - previousCenter[0] * previous.k, viewportCenter[1] - previousCenter[1] * previous.k)
        .scale(previous.k);
    }
    // Applying a transform interrupts any running animation (such as flying to a country), so
    // skip it when nothing would change, e.g. when React replays this effect in development.
    const next = behavior.constrain()(target, viewport, frame.translateExtent);
    const current = zoomTransform(svgElement);
    if (Math.abs(next.k - current.k) > 1e-6 || Math.abs(next.x - current.x) > 0.5 || Math.abs(next.y - current.y) > 0.5) {
      svg.call(behavior.transform, next);
    }

    return () => {
      svg.on('.zoom', null);
    };
  }, [viewport, frame, projection, initialView]);

  // Frame a country picked from the search or a legend list.
  useEffect(() => {
    if (!focusRequest || handledFocus.current === focusRequest.nonce) return;
    const svgElement = svgRef.current;
    const behavior = zoomRef.current;
    const country = countriesByKey.get(focusRequest.key);
    if (!svgElement || !behavior || !country) return;
    handledFocus.current = focusRequest.nonce;

    const [[vx0, vy0], [vx1, vy1]] = viewport;
    const usableRight = vx1 - vx0 > 2.2 * focusInsetRight ? vx1 - focusInsetRight : vx1;
    let bounds: Extent;
    let maxZoom = 8;
    if (country.feature) {
      bounds = path.bounds(largestPart(country.feature.geometry, (polygon) => path.area(polygon)));
    } else if (country.point) {
      const xy: [number, number] = projection(country.point) ?? [0, 0];
      bounds = [xy, xy];
      maxZoom = 6;
    } else {
      return;
    }

    const [[x0, y0], [x1, y1]] = bounds;
    const fit = 0.6 / Math.max((x1 - x0) / (usableRight - vx0), (y1 - y0) / (vy1 - vy0), 1e-6);
    const k = Math.max(1, Math.min(maxZoom, fit));
    const target = zoomIdentity
      .translate((vx0 + usableRight) / 2 - (k * (x0 + x1)) / 2, (vy0 + vy1) / 2 - (k * (y0 + y1)) / 2)
      .scale(k);
    select(svgElement)
      .transition()
      .duration(motionDuration(750))
      .call(behavior.transform, behavior.constrain()(target, viewport, frame.translateExtent));
  }, [focusRequest, countriesByKey, viewport, frame, focusInsetRight, path, projection]);

  const zoomBy = (factor: number) => {
    const svgElement = svgRef.current;
    const behavior = zoomRef.current;
    if (!svgElement || !behavior) return;
    select(svgElement).transition().duration(motionDuration(250)).call(behavior.scaleBy, factor);
  };

  const resetView = () => {
    const svgElement = svgRef.current;
    const behavior = zoomRef.current;
    if (!svgElement || !behavior) return;
    select(svgElement)
      .transition()
      .duration(motionDuration(500))
      .call(behavior.transform, behavior.constrain()(initialView, viewport, frame.translateExtent));
  };

  const handleKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const pan = PAN_KEYS[event.key];
    if (event.key === '+' || event.key === '=') {
      zoomBy(1.5);
    } else if (event.key === '-' || event.key === '_') {
      zoomBy(1 / 1.5);
    } else if (event.key === '0') {
      resetView();
    } else if (pan && svgRef.current && zoomRef.current) {
      const step = PAN_STEP / transform.k;
      select(svgRef.current)
        .transition()
        .duration(motionDuration(150))
        .call(zoomRef.current.translateBy, pan[0] * step, pan[1] * step);
    } else {
      return;
    }
    event.preventDefault();
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (event.pointerType !== 'mouse' || gesturing) return;
    const key = keyAt(event.target);
    setHover(
      key
        ? {
            key,
            x: event.clientX,
            y: event.clientY,
            flipX: event.clientX > window.innerWidth - 300,
            flipY: event.clientY > window.innerHeight - 220,
          }
        : null
    );
  };

  const handleClick = (event: MouseEvent<SVGSVGElement>) => onSelect(keyAt(event.target));

  const k = transform.k;
  const hoverShape = hover && hover.key !== selectedKey ? shapeByKey.get(hover.key) : undefined;
  const hoverDot = hover && hover.key !== selectedKey ? dots.find((dot) => dot.key === hover.key) : undefined;
  const selectedShape = selectedKey ? shapeByKey.get(selectedKey) : undefined;
  const selectedDot = selectedKey ? dots.find((dot) => dot.key === selectedKey) : undefined;
  const hoveredCountry = hover ? countriesByKey.get(hover.key) : undefined;

  return (
    <div className="world-map">
      <svg
        ref={svgRef}
        className={`world-map-svg${gesturing ? ' is-gesturing' : ''}`}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="application"
        aria-roledescription="map"
        aria-label="World map. Plus and minus zoom, arrow keys pan, 0 resets the view. Use the search to pick a country."
        tabIndex={0}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHover(null)}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <defs>
          {stripes.map(({ id, colors }) => (
            <pattern
              key={id}
              id={id}
              patternUnits="userSpaceOnUse"
              width={STRIPE_WIDTH * colors.length}
              height={STRIPE_WIDTH * colors.length}
              patternTransform="rotate(45)"
            >
              {colors.map((color, index) => (
                <rect
                  key={color}
                  x={index * STRIPE_WIDTH}
                  y={0}
                  width={STRIPE_WIDTH}
                  height={STRIPE_WIDTH * colors.length}
                  fill={color}
                />
              ))}
            </pattern>
          ))}
        </defs>
        <g transform={transform.toString()}>
          <path className="map-sphere" d={frame.sphere} />
          <path className="map-graticule" d={frame.graticule} />
          <CountryShapes shapes={shapes} fills={fills} />
          <path className="map-sphere-outline" d={frame.sphere} />
          <g className="country-dots">
            {dots.map(({ key, x, y }) => (
              <g key={key} data-key={key} transform={`translate(${x},${y})`}>
                <circle className="dot-hit" r={DOT_HIT_RADIUS / k} />
                <circle className="dot" r={DOT_RADIUS / k} fill={fillPaint(fills.get(key))} />
              </g>
            ))}
          </g>
          <g className="map-highlights">
            {hoverShape && <path className="outline-hover" d={hoverShape.d} />}
            {hoverDot && <circle className="outline-hover" cx={hoverDot.x} cy={hoverDot.y} r={(DOT_RADIUS + 2) / k} />}
            {selectedShape && <path className="outline-selected" d={selectedShape.d} />}
            {selectedDot && (
              <circle className="outline-selected" cx={selectedDot.x} cy={selectedDot.y} r={(DOT_RADIUS + 2.5) / k} />
            )}
          </g>
        </g>
      </svg>

      <div className="zoom-controls">
        <button type="button" className="icon-button" aria-label="Zoom in" disabled={k >= MAX_ZOOM - 0.01} onClick={() => zoomBy(1.6)}>
          <PlusIcon />
        </button>
        <button type="button" className="icon-button" aria-label="Zoom out" disabled={k <= 1.01} onClick={() => zoomBy(1 / 1.6)}>
          <MinusIcon />
        </button>
        <button type="button" className="icon-button" aria-label="Reset view" onClick={resetView}>
          <ResetIcon />
        </button>
      </div>

      {hover && hoveredCountry && !gesturing && (
        <Tooltip x={hover.x} y={hover.y} flipX={hover.flipX} flipY={hover.flipY}>
          {renderTooltip(hoveredCountry)}
        </Tooltip>
      )}
    </div>
  );
}
