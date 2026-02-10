import { useMemo } from 'react';
import type { LanguageData, LanguageFamilies } from '../../types';
import { getAllLanguages } from '../../utils/dataJoinUtils';

interface LanguageSelectorProps {
  langData: LanguageData;
  langFamilies: LanguageFamilies;
  selectedLanguages: string[];
  selectedLanguageColors: Record<string, string>;
  onChange: (codes: string[]) => void;
  disabled?: boolean;
}

export default function LanguageSelector({
  langData,
  langFamilies,
  selectedLanguages,
  selectedLanguageColors,
  onChange,
  disabled,
}: LanguageSelectorProps) {
  const languages = useMemo(() => getAllLanguages(langData, langFamilies), [langData, langFamilies]);
  const selectedLanguageSet = useMemo(() => new Set(selectedLanguages), [selectedLanguages]);

  const toggleLanguage = (code: string) => {
    if (selectedLanguageSet.has(code)) {
      onChange(selectedLanguages.filter((selectedCode) => selectedCode !== code));
      return;
    }

    onChange([...selectedLanguages, code]);
  };

  return (
    <div className="control-group">
      <div className="control-label-row">
        <span className="control-label">Select Languages</span>
        {selectedLanguages.length > 0 && (
          <button
            type="button"
            className="text-btn"
            onClick={() => onChange([])}
            disabled={disabled}
          >
            Clear
          </button>
        )}
      </div>
      <div className="language-selection-summary">
        {selectedLanguages.length === 0
          ? 'No languages selected'
          : `${selectedLanguages.length} language${selectedLanguages.length === 1 ? '' : 's'} selected`}
      </div>
      <div
        className="language-chip-grid"
        role="listbox"
        aria-label="Language selection"
        aria-multiselectable="true"
      >
        {languages.map((lang) => (
          <button
            key={lang.code}
            type="button"
            className={`language-chip ${selectedLanguageSet.has(lang.code) ? 'selected' : ''}`}
            onClick={() => toggleLanguage(lang.code)}
            aria-pressed={selectedLanguageSet.has(lang.code)}
            disabled={disabled}
          >
            <span
              className="language-chip-swatch"
              style={{
                background:
                  selectedLanguageSet.has(lang.code)
                    ? selectedLanguageColors[lang.code]
                    : 'transparent',
              }}
            />
            <span>{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
