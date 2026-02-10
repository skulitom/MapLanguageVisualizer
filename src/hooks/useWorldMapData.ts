import { useState, useEffect } from 'react';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type {
  CountryCodeMap,
  LanguageData,
  LanguageFamilies,
  CountryFeatureCollection,
} from '../types';

import countryCodeMap from '../data/country-code-map.json';
import languageData from '../data/language-data.json';
import languageFamiliesData from '../data/language-families.json';

export function useWorldMapData() {
  const [geoData, setGeoData] = useState<CountryFeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const topo: Topology = await import('world-atlas/countries-110m.json' as string) as unknown as Topology;
        const countries = feature(
          topo,
          topo.objects.countries as GeometryCollection
        ) as unknown as CountryFeatureCollection;
        setGeoData(countries);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load map data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return {
    geoData,
    codeMap: countryCodeMap as CountryCodeMap,
    langData: languageData as unknown as LanguageData,
    langFamilies: languageFamiliesData as unknown as LanguageFamilies,
    loading,
    error,
  };
}
