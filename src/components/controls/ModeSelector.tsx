import type { VisualizationMode } from '../../types';

interface ModeSelectorProps {
  mode: VisualizationMode;
  onChange: (mode: VisualizationMode) => void;
}

const MODES: { value: VisualizationMode; label: string }[] = [
  { value: 'highlight', label: 'Languages' },
  { value: 'families', label: 'Families' },
];

export default function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="segmented" role="group" aria-label="Colour countries by">
      {MODES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          className="segmented-option"
          aria-pressed={mode === value}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
