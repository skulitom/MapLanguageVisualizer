import { useId } from 'react';
import type { MapCountry } from '../../types';
import { LANGUAGE_BY_CODE, LANGUAGE_INFO, languageName } from '../../data/dataset';
import { CloseIcon } from '../icons';

interface CountrySummaryProps {
  country: MapCountry;
  titleId: string;
  onClose: () => void;
}

export function CountrySummary({ country, titleId, onClose }: CountrySummaryProps) {
  return (
    <div className="country-summary">
      <div className="country-heading">
        <h2 id={titleId} className="country-name">
          {country.name}
        </h2>
        <button type="button" className="icon-button" aria-label="Close country details" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      <p className="country-meta">
        {country.data ? `${country.data.primaryFamily} family` : 'No language data'}
        {country.alpha2 && <span className="country-code">{country.alpha2}</span>}
      </p>
    </div>
  );
}

/** Phone layout: the country's summary in the collapsed bottom sheet. */
export function CountryPeek(props: CountrySummaryProps) {
  const languages = props.country.data?.languages ?? [];
  return (
    <div className="country-peek">
      <CountrySummary {...props} />
      {languages.length > 0 && (
        <p className="country-inline-languages">{languages.map(languageName).join(' · ')}</p>
      )}
    </div>
  );
}

interface CountryLanguagesProps {
  country: MapCountry;
  selectedLanguages: string[];
  languageColors: Record<string, string>;
  canAddLanguage: boolean;
  onToggleLanguage: (code: string) => void;
}

export function CountryLanguages({
  country,
  selectedLanguages,
  languageColors,
  canAddLanguage,
  onToggleLanguage,
}: CountryLanguagesProps) {
  if (!country.data) {
    return <p className="hint country-empty">The dataset records no official languages for this territory.</p>;
  }

  return (
    <div className="country-languages">
      <h3 className="section-title">Official &amp; major languages</h3>
      <ul className="language-rows">
        {country.data.languages.map((code) => {
          const name = languageName(code);
          const info = LANGUAGE_INFO[code];
          const count = LANGUAGE_BY_CODE.get(code)?.countries.length ?? 1;
          const isSelected = selectedLanguages.includes(code);
          return (
            <li key={code} className="language-row">
              <div className="language-row-text">
                <span className="language-name">
                  {name}
                  {info?.nativeName && info.nativeName !== name && (
                    <span className="language-native" lang={code}>
                      {' '}
                      {info.nativeName}
                    </span>
                  )}
                </span>
                <span className="language-meta">
                  {info?.family ?? 'Unknown family'} ·{' '}
                  {count === 1 ? 'official only here' : `official in ${count} countries`}
                </span>
              </div>
              <button
                type="button"
                className="toggle-button"
                aria-pressed={isSelected}
                aria-label={isSelected ? `Stop highlighting ${name}` : `Highlight ${name} on the map`}
                disabled={!isSelected && !canAddLanguage}
                onClick={() => onToggleLanguage(code)}
              >
                {isSelected ? (
                  <>
                    <span
                      className="swatch swatch-small"
                      style={{ background: languageColors[code] }}
                      aria-hidden="true"
                    />
                    On map
                  </>
                ) : (
                  'Show'
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type CountryDetailPanelProps = CountryLanguagesProps & { onClose: () => void };

/** Desktop layout: a card floating over the map. */
export default function CountryDetailPanel({ onClose, ...props }: CountryDetailPanelProps) {
  const titleId = useId();
  return (
    <section className="country-card" aria-labelledby={titleId}>
      <CountrySummary country={props.country} titleId={titleId} onClose={onClose} />
      <CountryLanguages {...props} />
    </section>
  );
}
