/**
 * Generates src/data/country-points.json: a marker position for every country
 * in language-data.json that is too small to appear in the 1:110m world-atlas
 * geometry the app draws (Singapore, Malta, Bahrain, most island states...).
 *
 * Positions are the centroid of each country's largest polygon in the 1:50m
 * world-atlas file. Countries without a separate polygon at 1:50m either use a
 * hand-entered position from FALLBACK_POINTS.
 *
 * Run after prepare-language-data.ts: npm run data
 */

import { readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { geoArea, geoCentroid } from 'd3-geo';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import type { FeatureCollection, MultiPolygon, Polygon, Position } from 'geojson';
import { GEOMETRY_NAME_ALIASES } from '../src/data/geometryAliases';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'src', 'data');
const require = createRequire(import.meta.url);

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

// [longitude, latitude] for countries that have no polygon of their own at 1:50m.
const FALLBACK_POINTS: Record<string, [number, number]> = {
  TV: [179.2, -8.52], // Tuvalu (Funafuti)
  GF: [-53.1, 3.95], // French Guiana, drawn as part of France in world-atlas
};

const codeMap = readJson<Record<string, string>>(join(DATA_DIR, 'country-code-map.json'));
const languageData = readJson<Record<string, { name: string }>>(join(DATA_DIR, 'language-data.json'));
const atlas110 = readJson<Topology>(require.resolve('world-atlas/countries-110m.json'));
const atlas50 = readJson<Topology>(require.resolve('world-atlas/countries-50m.json'));

const drawn = new Set<string>();
for (const geometry of (atlas110.objects.countries as GeometryCollection<{ name: string }>).geometries) {
  const alpha2 =
    geometry.id !== undefined
      ? codeMap[String(geometry.id)]
      : GEOMETRY_NAME_ALIASES[geometry.properties?.name ?? ''];
  if (alpha2) drawn.add(alpha2);
}

const countries50 = feature(
  atlas50,
  atlas50.objects.countries as GeometryCollection
) as unknown as FeatureCollection<Polygon | MultiPolygon>;

function largestPolygonCentroid(geometry: Polygon | MultiPolygon): [number, number] {
  const polygons: Position[][][] =
    geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  let largest = polygons[0];
  let largestArea = -1;
  for (const rings of polygons) {
    let area = geoArea({ type: 'Polygon', coordinates: rings });
    if (area > 2 * Math.PI) area = 4 * Math.PI - area; // wound the other way
    if (area > largestArea) {
      largest = rings;
      largestArea = area;
    }
  }
  return geoCentroid({ type: 'Polygon', coordinates: largest });
}

const round = (value: number) => Math.round(value * 100) / 100;
const points: Record<string, [number, number]> = {};

for (const alpha2 of Object.keys(languageData).sort()) {
  if (drawn.has(alpha2)) continue;

  const numeric = Object.keys(codeMap).find((code) => codeMap[code] === alpha2);
  const match = countries50.features.find((f) => f.id !== undefined && String(f.id) === numeric);
  const point = match ? largestPolygonCentroid(match.geometry) : FALLBACK_POINTS[alpha2];
  if (!point) {
    throw new Error(`No position for ${alpha2} (${languageData[alpha2].name}); add it to FALLBACK_POINTS`);
  }
  points[alpha2] = [round(point[0]), round(point[1])];
}

writeFileSync(join(DATA_DIR, 'country-points.json'), `${JSON.stringify(points, null, 2)}\n`);
console.log(`✓ country-points.json (${Object.keys(points).length} countries drawn as points)`);
