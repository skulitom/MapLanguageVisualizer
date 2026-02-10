import type { VisualizationMode, LanguageData, LanguageFamilies } from '../../types';
import { DEFAULT_COLOR, NO_DATA_COLOR, createFamilyColorScale } from '../../utils/colorScales';
import { getUniqueFamilies, getLanguageName } from '../../utils/dataJoinUtils';

interface MapLegendProps {
  mode: VisualizationMode;
  selectedLanguages: string[];
  selectedLanguageColors: Record<string, string>;
  langData: LanguageData;
  langFamilies: LanguageFamilies;
}

export default function MapLegend({
  mode,
  selectedLanguages,
  selectedLanguageColors,
  langData,
  langFamilies,
}: MapLegendProps) {
  if (mode === 'highlight') {
    return (
      <div className="legend">
        <h4>Legend</h4>
        {selectedLanguages.length > 0 ? (
          <>
            {selectedLanguages.map((languageCode) => (
              <div key={languageCode} className="legend-item">
                <span
                  className="legend-swatch"
                  style={{ background: selectedLanguageColors[languageCode] ?? DEFAULT_COLOR }}
                />
                Speaks {getLanguageName(languageCode, langFamilies)}
              </div>
            ))}
            <div className="legend-item">
              <span className="legend-swatch" style={{ background: DEFAULT_COLOR }} />
              No selected languages spoken
            </div>
          </>
        ) : (
          <div className="legend-hint">Select one or more languages to highlight</div>
        )}
        <div className="legend-item">
          <span className="legend-swatch" style={{ background: NO_DATA_COLOR }} />
          No data
        </div>
      </div>
    );
  }

  // Family mode
  const families = getUniqueFamilies(langData);
  const colorScale = createFamilyColorScale(families);

  return (
    <div className="legend">
      <h4>Language Families</h4>
      {families.map((family) => (
        <div key={family} className="legend-item">
          <span className="legend-swatch" style={{ background: colorScale(family) }} />
          {family}
        </div>
      ))}
      <div className="legend-item">
        <span className="legend-swatch" style={{ background: NO_DATA_COLOR }} />
        No data
      </div>
    </div>
  );
}
