import type { Geometry } from 'geojson';

/** ISO 3166-1 numeric code → alpha-2 code. */
export interface CountryCodeMap {
  [numericCode: string]: string;
}

export interface LanguageInfo {
  name: string;
  nativeName: string;
  family: string;
}

/** Language code → name, native name and family. */
export interface LanguageFamilies {
  [languageCode: string]: LanguageInfo;
}

export interface CountryLanguageData {
  name: string;
  /** Official and major languages, most prominent first (ISO 639 codes such as en, es, arb, cmn). */
  languages: string[];
  /** Family of the first listed language. */
  primaryFamily: string;
}

/** Alpha-2 country code → its languages. */
export interface LanguageData {
  [alpha2Code: string]: CountryLanguageData;
}

export type VisualizationMode = 'highlight' | 'families';

export interface CountryFeature {
  type: 'Feature';
  id?: string;
  properties: { name: string };
  geometry: Geometry;
}

export interface CountryFeatureCollection {
  type: 'FeatureCollection';
  features: CountryFeature[];
}

/** A country as the map draws it: geometry (or a point) joined to its language data. */
export interface MapCountry {
  /** Alpha-2 code when known, otherwise `geo:<name>`. */
  key: string;
  alpha2: string | null;
  name: string;
  data: CountryLanguageData | null;
  /** Polygon geometry from the 1:110m atlas. */
  feature: CountryFeature | null;
  /** [longitude, latitude] for a country too small for the 1:110m atlas; drawn as a dot. */
  point: [number, number] | null;
}

export interface LanguageSummary {
  code: string;
  name: string;
  nativeName: string;
  family: string;
  /** Alpha-2 codes of the countries that list this language. */
  countries: string[];
}

export type CountryFill =
  | { type: 'solid'; color: string }
  | { type: 'stripes'; id: string; colors: string[] };

/** Ask the map to frame a country. A new nonce repeats the request for the same country. */
export interface FocusRequest {
  key: string;
  nonce: number;
}
