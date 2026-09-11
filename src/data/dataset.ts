import type { CountryCodeMap, LanguageData, LanguageFamilies, LanguageSummary } from '../types';
import countryCodeMap from './country-code-map.json';
import countryPoints from './country-points.json';
import languageData from './language-data.json';
import languageFamilies from './language-families.json';

export const CODE_MAP = countryCodeMap as CountryCodeMap;
export const LANGUAGE_DATA = languageData as unknown as LanguageData;
export const LANGUAGE_INFO = languageFamilies as unknown as LanguageFamilies;
export const COUNTRY_POINTS = countryPoints as unknown as Record<string, [number, number]>;

export const COUNTRY_COUNT = Object.keys(LANGUAGE_DATA).length;

export function languageName(code: string): string {
  return LANGUAGE_INFO[code]?.name ?? code;
}

function buildLanguageSummaries(): LanguageSummary[] {
  const countriesByLanguage = new Map<string, string[]>();
  for (const [alpha2, country] of Object.entries(LANGUAGE_DATA)) {
    for (const code of country.languages) {
      const countries = countriesByLanguage.get(code) ?? [];
      countries.push(alpha2);
      countriesByLanguage.set(code, countries);
    }
  }

  return Array.from(countriesByLanguage, ([code, countries]) => ({
    code,
    name: languageName(code),
    nativeName: LANGUAGE_INFO[code]?.nativeName ?? '',
    family: LANGUAGE_INFO[code]?.family ?? 'Unknown',
    countries,
  })).sort((a, b) => b.countries.length - a.countries.length || a.name.localeCompare(b.name));
}

/** Every language in the dataset, most widespread first. */
export const LANGUAGES = buildLanguageSummaries();
export const LANGUAGE_BY_CODE = new Map(LANGUAGES.map((language) => [language.code, language]));

function groupByFamily(): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const [alpha2, country] of Object.entries(LANGUAGE_DATA)) {
    const members = groups.get(country.primaryFamily) ?? [];
    members.push(alpha2);
    groups.set(country.primaryFamily, members);
  }
  return new Map([...groups].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])));
}

/** Alpha-2 codes of the countries in each primary language family, largest family first. */
export const COUNTRIES_BY_FAMILY = groupByFamily();

/** Countries per primary language family, largest family first. */
export const FAMILY_COUNTS = new Map(
  Array.from(COUNTRIES_BY_FAMILY, ([family, members]) => [family, members.length] as const)
);
