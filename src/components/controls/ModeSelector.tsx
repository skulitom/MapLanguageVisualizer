import type { VisualizationMode } from '../../types';

interface ModeSelectorProps {
  mode: VisualizationMode;
  onChange: (mode: VisualizationMode) => void;
}

export default function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="control-group">
      <label className="control-label">Visualization Mode</label>
      <div className="mode-buttons">
        <button
          className={`mode-btn ${mode === 'highlight' ? 'active' : ''}`}
          onClick={() => onChange('highlight')}
        >
          Highlight Languages
        </button>
        <button
          className={`mode-btn ${mode === 'families' ? 'active' : ''}`}
          onClick={() => onChange('families')}
        >
          Language Families
        </button>
      </div>
    </div>
  );
}
