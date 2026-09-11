import { useId, useRef } from 'react';
import type { PointerEvent, ReactNode } from 'react';

interface BottomSheetProps {
  label: string;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  /** Always visible; must fit the fixed peek height (--sheet-peek). */
  peek: ReactNode;
  children: ReactNode;
}

const SWIPE_THRESHOLD = 24;

/** Phone layout: controls live in a sheet over the bottom of the map. Tap or swipe the handle. */
export default function BottomSheet({ label, expanded, onExpandedChange, peek, children }: BottomSheetProps) {
  const bodyId = useId();
  const dragStartY = useRef<number | null>(null);
  const swiped = useRef(false);

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    dragStartY.current = event.clientY;
    swiped.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (dragStartY.current === null) return;
    const deltaY = event.clientY - dragStartY.current;
    dragStartY.current = null;
    if (Math.abs(deltaY) >= SWIPE_THRESHOLD) {
      swiped.current = true;
      onExpandedChange(deltaY < 0);
    }
  };

  const handleClick = () => {
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    onExpandedChange(!expanded);
  };

  return (
    <section className={`sheet${expanded ? ' is-expanded' : ''}`} aria-label={label}>
      <div className="sheet-top">
        <button
          type="button"
          className="sheet-handle"
          aria-expanded={expanded}
          aria-controls={bodyId}
          aria-label={expanded ? 'Show less' : 'Show more'}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            dragStartY.current = null;
          }}
          onClick={handleClick}
        >
          <span className="sheet-grip" />
        </button>
        <div className="sheet-peek">{peek}</div>
      </div>
      <div id={bodyId} className="sheet-body" hidden={!expanded}>
        {children}
      </div>
    </section>
  );
}
