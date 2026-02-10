import { useState } from 'react';
import { useWorldMapData } from './hooks/useWorldMapData';
import { useDimensions } from './hooks/useDimensions';
import { useMapInteraction } from './hooks/useMapInteraction';
import Header from './components/layout/Header';
import MainLayout from './components/layout/MainLayout';
import Sidebar from './components/layout/Sidebar';
import WorldMap from './components/map/WorldMap';
import MapLegend from './components/map/MapLegend';
import Tooltip from './components/map/Tooltip';
import ModeSelector from './components/controls/ModeSelector';
import LanguageSelector from './components/controls/LanguageSelector';
import CountryDetailPanel from './components/controls/CountryDetailPanel';
import type { VisualizationMode } from './types';
import { getLanguageHighlightColor } from './utils/colorScales';
import './App.css';

interface HighlightSelectionState {
  selectedLanguages: string[];
  colorMap: Record<string, string>;
  nextColorIndex: number;
}

export default function App() {
  const { geoData, codeMap, langData, langFamilies, loading, error } = useWorldMapData();
  const [containerRef, dimensions] = useDimensions();
  const [mode, setMode] = useState<VisualizationMode>('highlight');
  const [highlightSelection, setHighlightSelection] = useState<HighlightSelectionState>({
    selectedLanguages: [],
    colorMap: {},
    nextColorIndex: 0,
  });

  const { hovered, selected, handleMouseEnter, handleMouseMove, handleMouseLeave, handleClick, clearSelection } =
    useMapInteraction(codeMap, langData);

  const handleSelectedLanguagesChange = (languages: string[]) => {
    setHighlightSelection((prev) => {
      let nextColorIndex = prev.nextColorIndex;
      const nextColorMap: Record<string, string> = {};

      for (const languageCode of languages) {
        const existingColor = prev.colorMap[languageCode];
        if (existingColor) {
          nextColorMap[languageCode] = existingColor;
          continue;
        }

        nextColorMap[languageCode] = getLanguageHighlightColor(nextColorIndex);
        nextColorIndex += 1;
      }

      return {
        selectedLanguages: languages,
        colorMap: nextColorMap,
        nextColorIndex,
      };
    });
  };

  if (error) {
    return <div className="error">Failed to load map data: {error}</div>;
  }

  const sidebar = (
    <Sidebar>
      <ModeSelector mode={mode} onChange={setMode} />
      {mode === 'highlight' && (
        <LanguageSelector
          langData={langData}
          langFamilies={langFamilies}
          selectedLanguages={highlightSelection.selectedLanguages}
          selectedLanguageColors={highlightSelection.colorMap}
          onChange={handleSelectedLanguagesChange}
        />
      )}
      <MapLegend
        mode={mode}
        selectedLanguages={highlightSelection.selectedLanguages}
        selectedLanguageColors={highlightSelection.colorMap}
        langData={langData}
        langFamilies={langFamilies}
      />
      <CountryDetailPanel
        country={selected}
        langFamilies={langFamilies}
        onClose={clearSelection}
      />
    </Sidebar>
  );

  return (
    <div className="app">
      <Header />
      <MainLayout sidebar={sidebar}>
        <div ref={containerRef} className="map-wrapper">
          {loading && <div className="loading">Loading map data...</div>}
          {geoData && (
            <WorldMap
              geoData={geoData}
              codeMap={codeMap}
              langData={langData}
              langFamilies={langFamilies}
              dimensions={dimensions}
              mode={mode}
              selectedLanguages={highlightSelection.selectedLanguages}
              selectedLanguageColors={highlightSelection.colorMap}
              onMouseEnter={handleMouseEnter}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClick={handleClick}
            />
          )}
        </div>
        <Tooltip hovered={hovered} langFamilies={langFamilies} />
      </MainLayout>
    </div>
  );
}
