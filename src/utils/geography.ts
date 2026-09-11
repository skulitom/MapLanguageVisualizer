import type { Geometry, Polygon } from 'geojson';
import type { CountryFeatureCollection, MapCountry } from '../types';
import { CODE_MAP, COUNTRY_POINTS, LANGUAGE_DATA } from '../data/dataset';
import { GEOMETRY_NAME_ALIASES } from '../data/geometryAliases';

/**
 * Joins the atlas geometry to the language data. Countries too small for the
 * 1:110m atlas come from country-points.json and are drawn as dots.
 */
export function buildCountries(geo: CountryFeatureCollection): MapCountry[] {
  const countries: MapCountry[] = [];
  const seen = new Set<string>();

  for (const feature of geo.features) {
    const name = feature.properties.name;
    const alpha2 =
      (feature.id !== undefined ? CODE_MAP[String(feature.id)] : GEOMETRY_NAME_ALIASES[name]) ?? null;
    const key = alpha2 ?? `geo:${name}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const data = alpha2 ? (LANGUAGE_DATA[alpha2] ?? null) : null;
    countries.push({ key, alpha2, name: data?.name ?? name, data, feature, point: null });
  }

  for (const [alpha2, point] of Object.entries(COUNTRY_POINTS)) {
    const data = LANGUAGE_DATA[alpha2];
    if (!data || seen.has(alpha2)) continue;
    seen.add(alpha2);
    countries.push({ key: alpha2, alpha2, name: data.name, data, feature: null, point });
  }

  return countries;
}

/**
 * The largest polygon of a multipolygon, so that framing France or the United
 * States targets the mainland rather than every overseas territory.
 */
export function largestPart(geometry: Geometry, area: (polygon: Polygon) => number): Geometry {
  if (geometry.type !== 'MultiPolygon') return geometry;

  let largest: Polygon | null = null;
  let largestArea = -Infinity;
  for (const coordinates of geometry.coordinates) {
    const polygon: Polygon = { type: 'Polygon', coordinates };
    const polygonArea = area(polygon);
    if (polygonArea > largestArea) {
      largest = polygon;
      largestArea = polygonArea;
    }
  }
  return largest ?? geometry;
}
