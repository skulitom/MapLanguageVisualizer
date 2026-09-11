import type { CountryFill, CountryLanguageData, MapCountry, VisualizationMode } from '../types';
import { FAMILY_COUNTS } from '../data/dataset';

/**
 * Categorical hues (steps for a dark surface), handed to selected languages in
 * this fixed order. A language keeps its hue until it is deselected, and the
 * freed hue goes to the next language added.
 */
export const HIGHLIGHT_PALETTE = [
  '#3987e5', // blue
  '#d95926', // orange
  '#199e70', // aqua
  '#c98500', // yellow
  '#d55181', // magenta
  '#008300', // green
  '#9085e9', // violet
  '#e66767', // red
] as const;

export const MAX_SELECTED_LANGUAGES = HIGHLIGHT_PALETTE.length;

/** Countries with data that speak none of the selected languages. */
export const LAND_COLOR = '#2b3648';
export const NO_DATA_COLOR = '#172131';

/**
 * The seven largest families get their own hue; smaller families share a
 * neutral. The assignment was chosen so that every pair of families sharing a
 * land border stays apart under protanopia and deuteranopia simulation
 * (worst bordering pair: OKLab ΔE 12.6, and 19.1 for normal vision).
 */
export const FAMILY_COLORS: Record<string, string> = {
  'Indo-European': '#3987e5', // blue
  'Afro-Asiatic': '#c98500', // yellow
  Austronesian: '#d95926', // orange
  Turkic: '#d55181', // magenta
  'Sino-Tibetan': '#008300', // green
  'Niger-Congo': '#199e70', // aqua
  Uralic: '#e66767', // red
};

export const OTHER_FAMILIES = 'Other families';
export const OTHER_FAMILY_COLOR = '#a7afbd';

/** The legend entry a family belongs to: itself, or "Other families". */
export function familyGroup(family: string): string {
  return family in FAMILY_COLORS ? family : OTHER_FAMILIES;
}

export function familyColor(family: string): string {
  return FAMILY_COLORS[family] ?? OTHER_FAMILY_COLOR;
}

export interface FamilyLegendEntry {
  family: string;
  color: string;
  count: number;
  members?: { family: string; count: number }[];
}

function buildFamilyLegend(): FamilyLegendEntry[] {
  const entries: FamilyLegendEntry[] = [];
  const others: { family: string; count: number }[] = [];

  for (const [family, count] of FAMILY_COUNTS) {
    if (family in FAMILY_COLORS) entries.push({ family, color: FAMILY_COLORS[family], count });
    else others.push({ family, count });
  }

  if (others.length > 0) {
    entries.push({
      family: OTHER_FAMILIES,
      color: OTHER_FAMILY_COLOR,
      count: others.reduce((total, other) => total + other.count, 0),
      members: others,
    });
  }
  return entries;
}

/** Families in legend order, largest first, with the small ones folded together. */
export const FAMILY_LEGEND = buildFamilyLegend();

/** Keeps the hues already given out and hands each new language the first free one. */
export function assignLanguageColors(
  languages: string[],
  previous: Record<string, string>
): Record<string, string> {
  const colors: Record<string, string> = {};
  const used = new Set<string>();

  for (const code of languages) {
    const color = previous[code];
    if (color && !used.has(color)) {
      colors[code] = color;
      used.add(color);
    }
  }

  for (const code of languages) {
    if (colors[code]) continue;
    const color =
      HIGHLIGHT_PALETTE.find((candidate) => !used.has(candidate)) ??
      HIGHLIGHT_PALETTE[HIGHLIGHT_PALETTE.length - 1];
    colors[code] = color;
    used.add(color);
  }

  return colors;
}

/** The selected languages a country lists, in selection order. */
export function matchedLanguages(data: CountryLanguageData | null, selected: string[]): string[] {
  return data ? selected.filter((code) => data.languages.includes(code)) : [];
}

export interface StripeFill {
  id: string;
  colors: string[];
}

interface FillOptions {
  mode: VisualizationMode;
  languages: string[];
  colors: Record<string, string>;
  /** Families mode: show only this family (or legend group) in colour. */
  focusFamily: string | null;
}

/**
 * Fill for every country. A country that lists several selected languages is
 * striped with their hues (up to three).
 */
export function computeFills(
  countries: MapCountry[],
  { mode, languages, colors, focusFamily }: FillOptions
): { fills: Map<string, CountryFill>; stripes: StripeFill[] } {
  const fills = new Map<string, CountryFill>();
  const stripes = new Map<string, StripeFill>();

  for (const country of countries) {
    const data = country.data;
    if (!data) {
      fills.set(country.key, { type: 'solid', color: NO_DATA_COLOR });
      continue;
    }

    if (mode === 'families') {
      const family = data.primaryFamily;
      const dimmed = focusFamily !== null && focusFamily !== family && focusFamily !== familyGroup(family);
      fills.set(country.key, { type: 'solid', color: dimmed ? LAND_COLOR : familyColor(family) });
      continue;
    }

    const matched = matchedLanguages(data, languages);
    if (matched.length <= 1) {
      const color = matched.length === 1 ? (colors[matched[0]] ?? LAND_COLOR) : LAND_COLOR;
      fills.set(country.key, { type: 'solid', color });
      continue;
    }

    const stripeColors = matched.slice(0, 3).map((code) => colors[code] ?? LAND_COLOR);
    const id = `stripes-${stripeColors.map((color) => color.slice(1)).join('-')}`;
    stripes.set(id, { id, colors: stripeColors });
    fills.set(country.key, { type: 'stripes', id, colors: stripeColors });
  }

  return { fills, stripes: [...stripes.values()] };
}

export function fillPaint(fill: CountryFill | undefined): string {
  if (!fill) return NO_DATA_COLOR;
  return fill.type === 'solid' ? fill.color : `url(#${fill.id})`;
}
