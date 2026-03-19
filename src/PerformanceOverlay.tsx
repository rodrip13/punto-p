import type { PerfMetrics } from './usePerformanceMonitor';

function color(value: number, thresholds: [number, number]): string {
  if (value >= thresholds[0]) return '#4ade80'; // green
  if (value >= thresholds[1]) return '#facc15'; // yellow
  return '#f87171'; // red
}

function inverseColor(value: number, thresholds: [number, number]): string {
  if (value <= thresholds[0]) return '#4ade80';
  if (value <= thresholds[1]) return '#facc15';
  return '#f87171';
}

interface Props {
  metrics: PerfMetrics;
}

export function PerformanceOverlay({ metrics }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 8,
        left: 8,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.82)',
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: 11,
        lineHeight: 1.7,
        padding: '6px 10px',
        borderRadius: 6,
        pointerEvents: 'none',
        userSelect: 'none',
        minWidth: 180,
      }}
    >
      <div style={{ color: '#a1a1aa', marginBottom: 2, fontSize: 10 }}>
        PERF OVERLAY — ?perf=1
      </div>

      <Row
        label="FPS"
        value={metrics.fps}
        unit=""
        valueColor={color(metrics.fps, [50, 30])}
        hint="≥50 bueno · ≥30 aceptable · <30 jank"
      />
      <Row
        label="Renders/s"
        value={metrics.rendersPerSec}
        unit=""
        valueColor={inverseColor(metrics.rendersPerSec, [10, 60])}
        hint="idealmente <10 en reposo · >60 problema"
      />
      <Row
        label="setTransform/s"
        value={metrics.transformUpdatesPerSec}
        unit=""
        valueColor={inverseColor(metrics.transformUpdatesPerSec, [10, 60])}
        hint="debería ≈ FPS al arrastrar"
      />
    </div>
  );
}

function Row({
  label,
  value,
  unit,
  valueColor,
  hint,
}: {
  label: string;
  value: number;
  unit: string;
  valueColor: string;
  hint: string;
}) {
  return (
    <div title={hint}>
      <span style={{ color: '#a1a1aa', display: 'inline-block', width: 130 }}>
        {label}
      </span>
      <span style={{ color: valueColor, fontWeight: 'bold' }}>
        {value}
        {unit}
      </span>
    </div>
  );
}
