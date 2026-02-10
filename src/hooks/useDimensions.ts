import { useState, useEffect, useRef, useCallback } from 'react';
import type { MapDimensions } from '../types';

export function useDimensions(): [React.RefObject<HTMLDivElement | null>, MapDimensions] {
  const ref = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<MapDimensions>({ width: 960, height: 500 });

  const updateDimensions = useCallback(() => {
    if (ref.current) {
      const { width, height } = ref.current.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setDimensions({ width, height });
      }
    }
  }, []);

  useEffect(() => {
    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, [updateDimensions]);

  return [ref, dimensions];
}
