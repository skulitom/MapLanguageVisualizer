import type { GeoPermissibleObjects } from 'd3-geo';

export interface CountryCodeMap {
  [numericCode: string]: string; // numeric ISO → alpha-2
}

export interface LanguageInfo {
  name: string;
  nativeName: string;
  family: string;
}

export interface LanguageFamilies {
  [isoCode: string]: LanguageInfo;
}

export interface CountryLanguageData {
  name: string;
  languages: string[]; // ISO 639 variant codes (e.g., en, es, arb, cmn)
  primaryFamily: string;
}

export interface LanguageData {
  [alpha2Code: string]: CountryLanguageData;
}

export type VisualizationMode = 'highlight' | 'families';

export interface CountryFeature {
  type: 'Feature';
  id: string;
  properties: {
    name: string;
  };
  geometry: GeoPermissibleObjects;
}

export interface CountryFeatureCollection {
  type: 'FeatureCollection';
  features: CountryFeature[];
}

export interface MapDimensions {
  width: number;
  height: number;
}

export interface HoveredCountry {
  name: string;
  alpha2: string;
  languages: string[];
  primaryFamily: string;
  x: number;
  y: number;
}

export interface SelectedCountry {
  name: string;
  alpha2: string;
  languages: string[];
  primaryFamily: string;
}
