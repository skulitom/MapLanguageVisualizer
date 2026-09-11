import type { ReactNode } from 'react';

interface TooltipProps {
  /** Pointer position in viewport coordinates. */
  x: number;
  y: number;
  /** Place the tooltip left of / above the pointer, near the right or bottom edge. */
  flipX: boolean;
  flipY: boolean;
  children: ReactNode;
}

const OFFSET = 14;

export default function Tooltip({ x, y, flipX, flipY, children }: TooltipProps) {
  const dx = flipX ? `calc(-100% - ${OFFSET}px)` : `${OFFSET}px`;
  const dy = flipY ? `calc(-100% - ${OFFSET}px)` : `${OFFSET}px`;
  return (
    <div className="map-tooltip" role="tooltip" style={{ left: x, top: y, transform: `translate(${dx}, ${dy})` }}>
      {children}
    </div>
  );
}
