import { useEffect, useRef, useState, type MutableRefObject } from 'react';

export interface PerfMetrics {
  fps: number;
  rendersPerSec: number;
  transformUpdatesPerSec: number;
}

export interface PerfMonitor {
  metrics: PerfMetrics;
  renderCountRef: MutableRefObject<number>;
  transformCountRef: MutableRefObject<number>;
}

export function usePerformanceMonitor(enabled: boolean): PerfMonitor {
  const [metrics, setMetrics] = useState<PerfMetrics>({
    fps: 0,
    rendersPerSec: 0,
    transformUpdatesPerSec: 0,
  });

  // External counters — incremented by the consumer
  const renderCountRef = useRef(0);
  const transformCountRef = useRef(0);

  // Internal rAF loop counters
  const frameCountRef = useRef(0);
  const lastFlushRef = useRef(performance.now());
  const rafIdRef = useRef<number>();

  useEffect(() => {
    if (!enabled) return;

    const loop = (now: number) => {
      frameCountRef.current++;
      const elapsed = now - lastFlushRef.current;

      if (elapsed >= 1000) {
        setMetrics({
          fps: Math.round((frameCountRef.current * 1000) / elapsed),
          rendersPerSec: renderCountRef.current,
          transformUpdatesPerSec: transformCountRef.current,
        });
        frameCountRef.current = 0;
        renderCountRef.current = 0;
        transformCountRef.current = 0;
        lastFlushRef.current = now;
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [enabled]);

  return { metrics, renderCountRef, transformCountRef };
}
