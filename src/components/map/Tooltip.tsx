import type { HoveredCountry, LanguageFamilies } from '../../types';
import { getLanguageName } from '../../utils/dataJoinUtils';

interface TooltipProps {
  hovered: HoveredCountry | null;
  langFamilies: LanguageFamilies;
}

export default function Tooltip({ hovered, langFamilies }: TooltipProps) {
  if (!hovered) return null;

  return (
    <div
      className="tooltip"
      style={{
        left: hovered.x + 12,
        top: hovered.y - 10,
      }}
    >
      <strong>{hovered.name || 'Unknown'}</strong>
      {hovered.languages.length > 0 && (
        <>
          <div className="tooltip-row">
            <span className="tooltip-label">Languages:</span>{' '}
            {hovered.languages.map((c) => getLanguageName(c, langFamilies)).join(', ')}
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">Family:</span> {hovered.primaryFamily}
          </div>
        </>
      )}
      {hovered.languages.length === 0 && (
        <div className="tooltip-row" style={{ color: '#9ca3af' }}>No language data</div>
      )}
    </div>
  );
}
