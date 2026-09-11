import type { VisualizationMode } from '../types';

/** What a first-time visitor sees: the four most widespread official languages. */
export const DEFAULT_LANGUAGES = ['en', 'es', 'fr', 'arb'];

export interface UrlState {
  mode: VisualizationMode;
  languages: string[];
  country: string | null;
}

/**
 * Reads view state from the URL hash, e.g. `#langs=sw,pt&country=MZ` or
 * `#mode=families`. A missing `langs` means the default selection; an empty
 * `langs=` means none.
 */
export function parseUrlState(hash: string): UrlState {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const langs = params.get('langs');
  return {
    mode: params.get('mode') === 'families' ? 'families' : 'highlight',
    languages:
      langs === null
        ? [...DEFAULT_LANGUAGES]
        : langs.split(',').map((code) => code.trim()).filter(Boolean),
    country: params.get('country') || null,
  };
}

export function formatUrlState({ mode, languages, country }: UrlState): string {
  const parts: string[] = [];
  if (mode === 'families') parts.push('mode=families');
  if (languages.join(',') !== DEFAULT_LANGUAGES.join(',')) {
    parts.push(`langs=${languages.map(encodeURIComponent).join(',')}`);
  }
  if (country) parts.push(`country=${encodeURIComponent(country)}`);
  return parts.length > 0 ? `#${parts.join('&')}` : '';
}
