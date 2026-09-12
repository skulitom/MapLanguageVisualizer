import { useId, useMemo, useState } from 'react';
import { LANGUAGES } from '../../data/dataset';
import { normalizeText } from '../../utils/search';

interface LanguageSelectorProps {
  selectedLanguages: string[];
  languageColors: Record<string, string>;
  onToggle: (code: string) => void;
}

function countriesLabel(count: number): string {
  return count === 1 ? '1 country' : `${count} countries`;
}

export default function LanguageSelector({ selectedLanguages, languageColors, onToggle }: LanguageSelectorProps) {
  const titleId = useId();
  const [filter, setFilter] = useState('');
  const selected = useMemo(() => new Set(selectedLanguages), [selectedLanguages]);

  const visible = useMemo(() => {
    const query = normalizeText(filter);
    if (!query) return LANGUAGES;
    return LANGUAGES.filter(
      (language) =>
        normalizeText(language.name).includes(query) ||
        normalizeText(language.nativeName).includes(query) ||
        language.code === query
    );
  }, [filter]);

  return (
    <section className="panel-section" aria-labelledby={titleId}>
      <div className="section-head">
        <h2 id={titleId} className="section-title">
          Add languages
        </h2>
        {selectedLanguages.length > 0 && (
          <span className="section-meta">{selectedLanguages.length} selected</span>
        )}
      </div>
      <input
        type="search"
        className="filter-input"
        placeholder={`Filter ${LANGUAGES.length} languages`}
        aria-label="Filter languages"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
      />
      <div className="chip-grid" role="group" aria-labelledby={titleId}>
        {visible.map((language) => {
          const isSelected = selected.has(language.code);
          return (
            <button
              key={language.code}
              type="button"
              className="chip"
              aria-pressed={isSelected}
              aria-label={`${language.name}, official in ${countriesLabel(language.countries.length)}`}
              onClick={() => onToggle(language.code)}
            >
              <span
                className="chip-swatch"
                style={isSelected ? { background: languageColors[language.code] } : undefined}
                aria-hidden="true"
              />
              <span>{language.name}</span>
              <span className="chip-count" aria-hidden="true">
                {language.countries.length}
              </span>
            </button>
          );
        })}
        {visible.length === 0 && <p className="hint">No language matches “{filter.trim()}”.</p>}
      </div>
    </section>
  );
}
