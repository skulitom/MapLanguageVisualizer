import { scaleOrdinal } from 'd3-scale';
import { schemeTableau10 } from 'd3-scale-chromatic';

export const DEFAULT_COLOR = '#2b3648';
export const HOVER_COLOR = '#60a5fa';
export const NO_DATA_COLOR = '#111a28';
export const STROKE_COLOR = '#4d5d78';
export const GRATICULE_COLOR = '#253449';

const LANGUAGE_HIGHLIGHT_PALETTE = [
  '#60a5fa',
  '#34d399',
  '#f59e0b',
  '#f87171',
  '#22d3ee',
  '#a78bfa',
  '#f472b6',
  '#fb7185',
  '#4ade80',
  '#facc15',
] as const;

export function getLanguageHighlightColor(index: number): string {
  if (index < LANGUAGE_HIGHLIGHT_PALETTE.length) {
    return LANGUAGE_HIGHLIGHT_PALETTE[index];
  }

  const hue = Math.round((index * 137.508) % 360);
  return `hsl(${hue} 72% 58%)`;
}

export function createFamilyColorScale(families: string[]) {
  return scaleOrdinal<string, string>()
    .domain(families)
    .range(schemeTableau10 as string[]);
}
