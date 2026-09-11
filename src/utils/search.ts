import type { LanguageSummary, MapCountry } from '../types';

export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

/** 0 exact, 1 prefix, 2 word prefix, 3 substring; Infinity for no match. */
function matchScore(query: string, candidates: string[]): number {
  let best = Infinity;
  for (const candidate of candidates) {
    const text = normalizeText(candidate);
    if (!text) continue;
    if (text === query) return 0;
    if (text.startsWith(query)) best = Math.min(best, 1);
    else if (text.split(/[\s\-'’(),.]+/).some((word) => word.startsWith(query))) best = Math.min(best, 2);
    else if (query.length >= 3 && text.includes(query)) best = Math.min(best, 3);
  }
  return best;
}

function rank<T>(
  items: T[],
  query: string,
  candidates: (item: T) => string[],
  tieBreak: (a: T, b: T) => number,
  limit: number
): T[] {
  return items
    .map((item) => ({ item, score: matchScore(query, candidates(item)) }))
    .filter((entry) => entry.score < Infinity)
    .sort((a, b) => a.score - b.score || tieBreak(a.item, b.item))
    .slice(0, limit)
    .map((entry) => entry.item);
}

export interface SearchResults {
  countries: MapCountry[];
  languages: LanguageSummary[];
}

/** Matches countries by name or ISO code, and languages by English name, native name or code. */
export function searchMap(
  queryText: string,
  countries: MapCountry[],
  languages: LanguageSummary[],
  limit = 5
): SearchResults {
  const query = normalizeText(queryText);
  if (!query) return { countries: [], languages: [] };

  const codeQuery = query.length <= 3;
  return {
    countries: rank(
      countries,
      query,
      (country) => [country.name, codeQuery && country.alpha2 ? country.alpha2 : ''],
      (a, b) => a.name.localeCompare(b.name),
      limit
    ),
    languages: rank(
      languages,
      query,
      (language) => [language.name, language.nativeName, codeQuery ? language.code : ''],
      (a, b) => b.countries.length - a.countries.length,
      limit
    ),
  };
}
