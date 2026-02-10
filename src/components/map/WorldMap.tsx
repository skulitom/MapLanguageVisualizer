import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { geoNaturalEarth1, geoPath, geoGraticule } from 'd3-geo';
import type { GeoPermissibleObjects } from 'd3-geo';
import type {
  CountryFeatureCollection,
  CountryCodeMap,
  LanguageData,
  LanguageFamilies,
  MapDimensions,
  VisualizationMode,
} from '../../types';
import {
  DEFAULT_COLOR,
  NO_DATA_COLOR,
  STROKE_COLOR,
  GRATICULE_COLOR,
  createFamilyColorScale,
} from '../../utils/colorScales';
import { getUniqueFamilies } from '../../utils/dataJoinUtils';

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const ZOOM_SENSITIVITY = 0.0015;

interface ZoomTransform {
  scale: number;
  x: number;
  y: number;
}

interface PanStartState {
  pointerX: number;
  pointerY: number;
  mapX: number;
  mapY: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clampTransform(
  x: number,
  y: number,
  scale: number,
  width: number,
  height: number
): Pick<ZoomTransform, 'x' | 'y'> {
  const minX = width - width * scale;
  const minY = height - height * scale;

  return {
    x: clamp(x, minX, 0),
    y: clamp(y, minY, 0),
  };
}

interface WorldMapProps {
  geoData: CountryFeatureCollection;
  codeMap: CountryCodeMap;
  langData: LanguageData;
  langFamilies: LanguageFamilies;
  dimensions: MapDimensions;
  mode: VisualizationMode;
  selectedLanguages: string[];
  selectedLanguageColors: Record<string, string>;
  onMouseEnter: (id: string, name: string, e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onClick: (id: string, name: string) => void;
  hoveredId?: string;
}

export default function WorldMap({
  geoData,
  codeMap,
  langData,
  dimensions,
  mode,
  selectedLanguages,
  selectedLanguageColors,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
  onClick,
}: WorldMapProps) {
  const { width, height } = dimensions;

  const projection = useMemo(() => {
    const proj = geoNaturalEarth1();
    proj.fitSize([width, height], geoData as unknown as GeoPermissibleObjects);
    return proj;
  }, [geoData, width, height]);

  const pathGenerator = useMemo(() => geoPath(projection), [projection]);

  const graticule = useMemo(() => geoGraticule()(), []);

  const families = useMemo(() => getUniqueFamilies(langData), [langData]);
  const familyColor = useMemo(() => createFamilyColorScale(families), [families]);
  const [zoomTransform, setZoomTransform] = useState<ZoomTransform>({ scale: 1, x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<PanStartState | null>(null);
  const didDragRef = useRef(false);

  const handleWheelZoom = useCallback((event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();

    const rect = event.currentTarget.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;

    setZoomTransform((previous) => {
      const zoomFactor = Math.exp(-event.deltaY * ZOOM_SENSITIVITY);
      const nextScale = clamp(previous.scale * zoomFactor, MIN_ZOOM, MAX_ZOOM);

      if (Math.abs(nextScale - previous.scale) < 0.0001) {
        return previous;
      }

      const worldX = (pointerX - previous.x) / previous.scale;
      const worldY = (pointerY - previous.y) / previous.scale;
      const nextX = pointerX - worldX * nextScale;
      const nextY = pointerY - worldY * nextScale;
      const clamped = clampTransform(nextX, nextY, nextScale, width, height);

      return {
        scale: nextScale,
        x: clamped.x,
        y: clamped.y,
      };
    });
  }, [width, height]);

  const handleMouseDown = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (event.button !== 0) return;

    event.preventDefault();
    panStartRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      mapX: zoomTransform.x,
      mapY: zoomTransform.y,
    };
    didDragRef.current = false;
    setIsPanning(true);
    onMouseLeave();
  }, [zoomTransform.x, zoomTransform.y, onMouseLeave]);

  useEffect(() => {
    if (!isPanning) return;

    const handleWindowMouseMove = (event: MouseEvent) => {
      const panStart = panStartRef.current;
      if (!panStart) return;

      const deltaX = event.clientX - panStart.pointerX;
      const deltaY = event.clientY - panStart.pointerY;

      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        didDragRef.current = true;
      }

      setZoomTransform((prev) => {
        const nextX = panStart.mapX + deltaX;
        const nextY = panStart.mapY + deltaY;
        const clamped = clampTransform(nextX, nextY, prev.scale, width, height);
        return { ...prev, x: clamped.x, y: clamped.y };
      });
    };

    const stopPanning = () => {
      setIsPanning(false);
      panStartRef.current = null;
      window.setTimeout(() => {
        didDragRef.current = false;
      }, 0);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', stopPanning);
    window.addEventListener('mouseleave', stopPanning);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', stopPanning);
      window.removeEventListener('mouseleave', stopPanning);
    };
  }, [isPanning, width, height]);

  const getColor = useMemo(() => {
    return (numericId: string) => {
      const alpha2 = codeMap[numericId];
      const data = alpha2 ? langData[alpha2] : undefined;
      if (!data) return NO_DATA_COLOR;

      if (mode === 'highlight') {
        if (selectedLanguages.length === 0) return DEFAULT_COLOR;

        const matchedLanguage = selectedLanguages.find((code) => data.languages.includes(code));
        if (!matchedLanguage) return DEFAULT_COLOR;

        return selectedLanguageColors[matchedLanguage] ?? DEFAULT_COLOR;
      }

      return familyColor(data.primaryFamily);
    };
  }, [mode, selectedLanguages, selectedLanguageColors, codeMap, langData, familyColor]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`world-map-svg ${isPanning ? 'panning' : ''}`}
      onWheel={handleWheelZoom}
      onMouseDown={handleMouseDown}
      onDragStart={(event) => event.preventDefault()}
    >
      <g transform={`translate(${zoomTransform.x}, ${zoomTransform.y}) scale(${zoomTransform.scale})`}>
        {/* Graticule */}
        <path
          d={pathGenerator(graticule) ?? ''}
          fill="none"
          stroke={GRATICULE_COLOR}
          strokeWidth={0.5}
          vectorEffect="non-scaling-stroke"
        />

        {/* Sphere outline */}
        <path
          d={pathGenerator({ type: 'Sphere' }) ?? ''}
          fill="none"
          stroke={STROKE_COLOR}
          strokeWidth={0.5}
          vectorEffect="non-scaling-stroke"
        />

        {/* Countries */}
        {geoData.features.map((feature) => {
          const id = String(feature.id);
          const d = pathGenerator(feature as unknown as GeoJSON.Feature);
          if (!d) return null;

          return (
            <path
              key={id}
              d={d}
              fill={getColor(id)}
              stroke={STROKE_COLOR}
              strokeWidth={0.5}
              vectorEffect="non-scaling-stroke"
              style={{ cursor: 'pointer', transition: 'fill 0.2s' }}
              onMouseEnter={(e) => {
                if (!isPanning) onMouseEnter(id, '', e);
              }}
              onMouseMove={(e) => {
                if (!isPanning) onMouseMove(e);
              }}
              onMouseLeave={() => {
                if (!isPanning) onMouseLeave();
              }}
              onClick={() => {
                if (didDragRef.current) {
                  didDragRef.current = false;
                  return;
                }
                onClick(id, '');
              }}
            />
          );
        })}
      </g>
    </svg>
  );
}
