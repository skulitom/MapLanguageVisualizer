import { useEffect, useState } from 'react';

export interface ElementSize {
  width: number;
  height: number;
}

/** Tracks an element's rounded content size. Attach the returned callback as its ref. */
export function useElementSize<T extends HTMLElement>(): [(element: T | null) => void, ElementSize] {
  const [element, setElement] = useState<T | null>(null);
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

  useEffect(() => {
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      setSize((previous) =>
        previous.width === width && previous.height === height ? previous : { width, height }
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return [setElement, size];
}
