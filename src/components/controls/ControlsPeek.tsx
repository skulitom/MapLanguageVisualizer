import type { VisualizationMode } from '../../types';
import { languageName } from '../../data/dataset';
import { FAMILY_LEGEND } from '../../utils/colorScales';
import { CloseIcon } from '../icons';
import ModeSelector from './ModeSelector';

interface ControlsPeekProps {
  mode: VisualizationMode;
  onModeChange: (mode: VisualizationMode) => void;
  selectedLanguages: string[];
  languageColors: Record<string, string>;
  onRemoveLanguage: (code: string) => void;
  focusFamily: string | null;
  onFocusFamily: (family: string | null) => void;
  onExpand: () => void;
}

/** Phone layout: what the collapsed bottom sheet shows when no country is selected. */
export default function ControlsPeek({
  mode,
  onModeChange,
  selectedLanguages,
  languageColors,
  onRemoveLanguage,
  focusFamily,
  onFocusFamily,
  onExpand,
}: ControlsPeekProps) {
  return (
    <div className="controls-peek">
      <ModeSelector mode={mode} onChange={onModeChange} />
      <div className="pill-row">
        {mode === 'highlight' ? (
          <>
            {selectedLanguages.map((code) => (
              <span key={code} className="pill">
                <span className="swatch swatch-small" style={{ background: languageColors[code] }} aria-hidden="true" />
                {languageName(code)}
                <button
                  type="button"
                  className="pill-remove"
                  aria-label={`Remove ${languageName(code)}`}
                  onClick={() => onRemoveLanguage(code)}
                >
                  <CloseIcon />
                </button>
              </span>
            ))}
            <button type="button" className="pill pill-action" onClick={onExpand}>
              {selectedLanguages.length === 0 ? '+ Choose languages' : '+ Add'}
            </button>
          </>
        ) : (
          FAMILY_LEGEND.map((entry) => (
            <button
              key={entry.family}
              type="button"
              className="pill"
              aria-pressed={focusFamily === entry.family}
              onClick={() => onFocusFamily(focusFamily === entry.family ? null : entry.family)}
            >
              <span className="swatch swatch-small" style={{ background: entry.color }} aria-hidden="true" />
              {entry.family}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
