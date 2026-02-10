import { useState, useCallback } from 'react';
import type { HoveredCountry, SelectedCountry, CountryCodeMap, LanguageData } from '../types';

export function useMapInteraction(codeMap: CountryCodeMap, langData: LanguageData) {
  const [hovered, setHovered] = useState<HoveredCountry | null>(null);
  const [selected, setSelected] = useState<SelectedCountry | null>(null);

  const handleMouseEnter = useCallback(
    (numericId: string, name: string, event: React.MouseEvent) => {
      const alpha2 = codeMap[numericId];
      const data = alpha2 ? langData[alpha2] : undefined;
      setHovered({
        name: data?.name ?? name,
        alpha2: alpha2 ?? '',
        languages: data?.languages ?? [],
        primaryFamily: data?.primaryFamily ?? 'Unknown',
        x: event.clientX,
        y: event.clientY,
      });
    },
    [codeMap, langData]
  );

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    setHovered((prev) =>
      prev ? { ...prev, x: event.clientX, y: event.clientY } : null
    );
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovered(null);
  }, []);

  const handleClick = useCallback(
    (numericId: string, name: string) => {
      const alpha2 = codeMap[numericId];
      const data = alpha2 ? langData[alpha2] : undefined;
      setSelected({
        name: data?.name ?? name,
        alpha2: alpha2 ?? '',
        languages: data?.languages ?? [],
        primaryFamily: data?.primaryFamily ?? 'Unknown',
      });
    },
    [codeMap, langData]
  );

  const clearSelection = useCallback(() => {
    setSelected(null);
  }, []);

  return {
    hovered,
    selected,
    handleMouseEnter,
    handleMouseMove,
    handleMouseLeave,
    handleClick,
    clearSelection,
  };
}
