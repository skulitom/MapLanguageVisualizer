import type { SelectedCountry, LanguageFamilies } from '../../types';
import { getLanguageName } from '../../utils/dataJoinUtils';

interface CountryDetailPanelProps {
  country: SelectedCountry | null;
  langFamilies: LanguageFamilies;
  onClose: () => void;
}

export default function CountryDetailPanel({ country, langFamilies, onClose }: CountryDetailPanelProps) {
  if (!country) return null;

  return (
    <div className="country-detail">
      <div className="detail-header">
        <h3>{country.name}</h3>
        <button className="close-btn" onClick={onClose} aria-label="Close">
          &times;
        </button>
      </div>
      {country.alpha2 && (
        <div className="detail-code">Code: {country.alpha2}</div>
      )}
      <div className="detail-section">
        <h4>Primary Language Family</h4>
        <p>{country.primaryFamily}</p>
      </div>
      {country.languages.length > 0 && (
        <div className="detail-section">
          <h4>Official / Major Languages</h4>
          <ul className="language-list">
            {country.languages.map((code) => {
              const info = langFamilies[code];
              return (
                <li key={code}>
                  <strong>{getLanguageName(code, langFamilies)}</strong>
                  {info?.nativeName && info.nativeName !== info.name && (
                    <span className="native-name"> ({info.nativeName})</span>
                  )}
                  {info?.family && (
                    <span className="lang-family"> — {info.family}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {country.languages.length === 0 && (
        <p className="no-data">No language data available</p>
      )}
    </div>
  );
}
