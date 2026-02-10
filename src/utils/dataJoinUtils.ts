import type { CountryCodeMap, LanguageData, LanguageFamilies, CountryLanguageData } from '../types';

export function getAlpha2(numericId: string, codeMap: CountryCodeMap): string | undefined {
  return codeMap[numericId];
}

export function getCountryData(
  numericId: string,
  codeMap: CountryCodeMap,
  langData: LanguageData
): CountryLanguageData | undefined {
  const alpha2 = codeMap[numericId];
  if (!alpha2) return undefined;
  return langData[alpha2];
}

export function getLanguageName(code: string, families: LanguageFamilies): string {
  return families[code]?.name ?? code;
}

export function getAllLanguages(langData: LanguageData, families: LanguageFamilies) {
  const langSet = new Set<string>();
  for (const country of Object.values(langData)) {
    for (const code of country.languages) {
      langSet.add(code);
    }
  }
  return Array.from(langSet)
    .map((code) => ({ code, name: getLanguageName(code, families) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getUniqueFamilies(langData: LanguageData): string[] {
  const families = new Set<string>();
  for (const country of Object.values(langData)) {
    if (country.primaryFamily) {
      families.add(country.primaryFamily);
    }
  }
  return Array.from(families).sort();
}
