import { useState } from 'react';
import type { VisualizationMode } from '../../types';
import { COUNTRIES_BY_FAMILY, LANGUAGE_BY_CODE, LANGUAGE_DATA, languageName } from '../../data/dataset';
import { FAMILY_LEGEND, LAND_COLOR, NO_DATA_COLOR } from '../../utils/colorScales';
import type { FamilyLegendEntry } from '../../utils/colorScales';
import { ChevronIcon, CloseIcon } from '../icons';

interface MapLegendProps {
  mode: VisualizationMode;
  selectedLanguages: string[];
  languageColors: Record<string, string>;
  /** Some country lists more than one selected language and is drawn striped. */
  showStripes: boolean;
  focusFamily: string | null;
  onFocusFamily: (family: string | null) => void;
  onPreviewFamily: (family: string | null) => void;
  onRemoveLanguage: (code: string) => void;
  onClearLanguages: () => void;
  onSelectCountry: (key: string) => void;
}

function countriesIn(entry: FamilyLegendEntry): string[] {
  const families = entry.members ? entry.members.map((member) => member.family) : [entry.family];
  return families.flatMap((family) => COUNTRIES_BY_FAMILY.get(family) ?? []);
}

interface CountryListProps {
  codes: string[];
  onSelectCountry: (key: string) => void;
}

/** The countries behind a legend row: the map's data as a list, one tap from each country. */
function CountryList({ codes, onSelectCountry }: CountryListProps) {
  const sorted = [...codes].sort((a, b) => LANGUAGE_DATA[a].name.localeCompare(LANGUAGE_DATA[b].name));
  return (
    <ul className="country-list">
      {sorted.map((code) => (
        <li key={code}>
          <button type="button" className="country-link" onClick={() => onSelectCountry(code)}>
            {LANGUAGE_DATA[code].name}
          </button>
        </li>
      ))}
    </ul>
  );
}

interface CountToggleProps {
  count: number;
  label: string;
  expanded: boolean;
  onToggle: () => void;
}

function CountToggle({ count, label, expanded, onToggle }: CountToggleProps) {
  return (
    <button
      type="button"
      className="count-toggle"
      aria-expanded={expanded}
      aria-label={`${expanded ? 'Hide' : 'List'} the ${count} ${count === 1 ? 'country' : 'countries'}: ${label}`}
      onClick={onToggle}
    >
      {count}
      <ChevronIcon className="count-toggle-icon" />
    </button>
  );
}

export default function MapLegend({
  mode,
  selectedLanguages,
  languageColors,
  showStripes,
  focusFamily,
  onFocusFamily,
  onPreviewFamily,
  onRemoveLanguage,
  onClearLanguages,
  onSelectCountry,
}: MapLegendProps) {
  const [openList, setOpenList] = useState<string | null>(null);
  const toggleList = (key: string) => setOpenList((current) => (current === key ? null : key));

  if (mode === 'highlight') {
    return (
      <section className="panel-section" aria-label="Highlighted languages">
        <div className="section-head">
          <h2 className="section-title">Highlighted languages</h2>
          {selectedLanguages.length > 0 && (
            <button type="button" className="text-button" onClick={onClearLanguages}>
              Clear all
            </button>
          )}
        </div>
        {selectedLanguages.length === 0 && (
          <p className="hint">Pick languages below, or search, to see where each one is official.</p>
        )}
        <ul className="legend-list">
          {selectedLanguages.map((code) => {
            const name = languageName(code);
            const countries = LANGUAGE_BY_CODE.get(code)?.countries ?? [];
            const listKey = `language:${code}`;
            return (
              <li key={code}>
                <div className="legend-row">
                  <span className="swatch" style={{ background: languageColors[code] }} aria-hidden="true" />
                  <span className="legend-label">{name}</span>
                  <CountToggle
                    count={countries.length}
                    label={name}
                    expanded={openList === listKey}
                    onToggle={() => toggleList(listKey)}
                  />
                  <button
                    type="button"
                    className="icon-button icon-button-small"
                    aria-label={`Remove ${name}`}
                    onClick={() => onRemoveLanguage(code)}
                  >
                    <CloseIcon />
                  </button>
                </div>
                {openList === listKey && <CountryList codes={countries} onSelectCountry={onSelectCountry} />}
              </li>
            );
          })}
          {showStripes && (
            <li className="legend-row legend-row-static">
              <span className="swatch swatch-stripes" aria-hidden="true" />
              <span className="legend-label">Striped: more than one of these</span>
            </li>
          )}
          {selectedLanguages.length > 0 && (
            <li className="legend-row legend-row-static">
              <span className="swatch" style={{ background: LAND_COLOR }} aria-hidden="true" />
              <span className="legend-label">None of these</span>
            </li>
          )}
          <li className="legend-row legend-row-static">
            <span className="swatch" style={{ background: NO_DATA_COLOR }} aria-hidden="true" />
            <span className="legend-label">No data</span>
          </li>
        </ul>
      </section>
    );
  }

  const previewHandlers = (family: string) => ({
    onPointerEnter: (event: React.PointerEvent) => {
      if (event.pointerType === 'mouse') onPreviewFamily(family);
    },
    onPointerLeave: () => onPreviewFamily(null),
  });

  return (
    <section className="panel-section" aria-label="Language families">
      <div className="section-head">
        <h2 className="section-title">Language families</h2>
        {focusFamily && (
          <button type="button" className="text-button" onClick={() => onFocusFamily(null)}>
            Show all
          </button>
        )}
      </div>
      <p className="hint">Each country takes the family of its first-listed official language. Select one to isolate it.</p>
      <ul className="legend-list">
        {FAMILY_LEGEND.map((entry) => {
          const listKey = `family:${entry.family}`;
          return (
            <li key={entry.family}>
              <div className="legend-row">
                <button
                  type="button"
                  className="legend-toggle"
                  aria-pressed={focusFamily === entry.family}
                  onClick={() => onFocusFamily(focusFamily === entry.family ? null : entry.family)}
                  {...previewHandlers(entry.family)}
                >
                  <span className="swatch" style={{ background: entry.color }} aria-hidden="true" />
                  <span className="legend-label">{entry.family}</span>
                </button>
                <CountToggle
                  count={entry.count}
                  label={entry.family}
                  expanded={openList === listKey}
                  onToggle={() => toggleList(listKey)}
                />
              </div>
              {entry.members && (
                <ul className="legend-sublist" aria-label="Families grouped as other">
                  {entry.members.map((member) => (
                    <li key={member.family}>
                      <button
                        type="button"
                        className="legend-subrow"
                        aria-pressed={focusFamily === member.family}
                        onClick={() => onFocusFamily(focusFamily === member.family ? null : member.family)}
                        {...previewHandlers(member.family)}
                      >
                        {member.family}
                        <span className="legend-count">{member.count}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {openList === listKey && <CountryList codes={countriesIn(entry)} onSelectCountry={onSelectCountry} />}
            </li>
          );
        })}
        <li className="legend-row legend-row-static">
          <span className="swatch" style={{ background: NO_DATA_COLOR }} aria-hidden="true" />
          <span className="legend-label">No data</span>
        </li>
      </ul>
    </section>
  );
}
