import { useEffect, useMemo, useState } from 'react';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import type { CountryFeatureCollection, MapCountry } from '../types';
import { buildCountries } from '../utils/geography';

interface WorldGeometry {
  countries: MapCountry[];
  countriesByKey: Map<string, MapCountry>;
  loading: boolean;
  error: string | null;
}

/** Loads the 1:110m world atlas (a separate chunk) and joins it to the language data. */
export function useWorldGeometry(): WorldGeometry {
  const [geo, setGeo] = useState<CountryFeatureCollection | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    import('world-atlas/countries-110m.json' as string)
      .then((module) => {
        if (cancelled) return;
        const topology = (module.default ?? module) as Topology;
        const countries = feature(topology, topology.objects.countries as GeometryCollection);
        setGeo(countries as unknown as CountryFeatureCollection);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Failed to load map data');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const countries = useMemo(() => (geo ? buildCountries(geo) : []), [geo]);
  const countriesByKey = useMemo(
    () => new Map(countries.map((country) => [country.key, country])),
    [countries]
  );

  return { countries, countriesByKey, loading: !geo && !error, error };
}
