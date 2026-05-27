import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useHistoricalData } from '../../hooks/useHistoricalData';
import { useZoneThresholds } from '../../hooks/useZoneThresholds';

const RANGES = [
  { key: '24h', label: '24 h' },
  { key: '7d',  label: '7 d'  },
  { key: '30d', label: '30 d' },
];

const SENSOR_LABELS = {
  air_temp:     'Air Temperature',
  air_hum:      'Relative Humidity',
  soil_moist:   'Soil Moisture',
  soil_temp:    'Soil Temperature',
  soil_cond:    'Soil Conductivity',
  soil_ph:      'Soil pH',
  soil_n:       'Nitrogen',
  soil_p:       'Phosphorus',
  soil_k:       'Potassium',
  soil_salinity:'Soil Salinity',
  soil_tds:     'Soil TDS',
};

function formatAxisTime(iso, range) {
  if (!iso) return '';
  const d = new Date(iso);
  if (range === '24h') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function ChartTooltip({ active, payload, label, unit, range }) {
  if (!active || !payload?.length) return null;
  const d = new Date(label);
  const timeStr = range === '24h'
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  const val = payload[0]?.value;
  return (
    <div
      className="bg-surface border border-border px-3 py-2 text-left"
      style={{ fontFamily: "'Source Code Pro', monospace" }}
    >
      <p className="text-muted text-[10px] mb-1">{timeStr}</p>
      <p className="text-accent text-sm font-semibold tabular-nums">
        {typeof val === 'number' ? val.toFixed(2) : '—'}{' '}
        <span className="text-muted text-[10px] font-normal">{unit}</span>
      </p>
    </div>
  );
}

function classifyValue(value, threshold) {
  if (!threshold || typeof value !== 'number') return 'OK';

  const critical = threshold.critical ?? {};
  const warn = threshold.warn ?? {};
  if ((critical.min != null && value < critical.min) || (critical.max != null && value > critical.max)) {
    return 'CRITICAL';
  }
  if ((warn.min != null && value < warn.min) || (warn.max != null && value > warn.max)) {
    return 'WARNING';
  }
  return 'OK';
}

function dotColor(severity) {
  switch (severity) {
    case 'CRITICAL': return 'var(--color-crit)';
    case 'WARNING': return 'var(--color-warn)';
    default: return 'var(--color-accent)';
  }
}

ChartTooltip.propTypes = {
  active:  PropTypes.bool,
  payload: PropTypes.array,
  label:   PropTypes.string,
  unit:    PropTypes.string,
  range:   PropTypes.string,
};

export default function HistoricalTrendPanel({ sensorKey, greenhouseId, zoneId, onClose }) {
  const [range, setRange] = useState('24h');

  const { data, meta, isLoading, error } = useHistoricalData({
    greenhouseId,
    sensorKey,
    zoneId,
    range,
  });

  const label = SENSOR_LABELS[sensorKey] ?? sensorKey;
  const unit  = meta?.unit ?? '';
  const { thresholds } = useZoneThresholds({ greenhouseId, zoneId });
  const sensorThreshold = thresholds?.[sensorKey] ?? null;

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const chartData = data.map(p => ({
    t: p.timestamp,
    v: p.value,
    severity: classifyValue(p.value, sensorThreshold),
  }));

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.97 }}
          transition={{ duration: 0.22 }}
          className="relative bg-surface border border-border w-full max-w-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <h3
                className="text-ink text-lg leading-none"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {label}
              </h3>
              {unit && (
                <span
                  className="text-muted text-[9px] tracking-widest uppercase mt-1 block"
                  style={{ fontFamily: "'Source Code Pro', monospace" }}
                >
                  {unit}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Range selector */}
              <div className="flex border border-border overflow-hidden">
                {RANGES.map(r => (
                  <button
                    key={r.key}
                    onClick={() => setRange(r.key)}
                    className={`px-3 py-1.5 text-[9px] tracking-widest uppercase transition-colors ${
                      range === r.key
                        ? 'bg-accent/15 text-accent'
                        : 'text-muted hover:text-ink'
                    }`}
                    style={{ fontFamily: "'Source Code Pro', monospace" }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <button
                onClick={onClose}
                className="text-muted hover:text-ink transition-colors w-8 h-8 flex items-center justify-center border border-transparent hover:border-border"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Chart area */}
          <div className="px-2 py-5" style={{ height: 280 }}>
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <span
                  className="text-muted text-[10px] tracking-widest uppercase animate-pulse"
                  style={{ fontFamily: "'Source Code Pro', monospace" }}
                >
                  Loading…
                </span>
              </div>
            )}

            {!isLoading && error && (
              <div className="flex items-center justify-center h-full">
                <span
                  className="text-muted text-[10px] tracking-widest uppercase"
                  style={{ fontFamily: "'Source Code Pro', monospace" }}
                >
                  {error}
                </span>
              </div>
            )}

            {!isLoading && !error && chartData.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <span
                  className="text-muted text-[10px] tracking-widest uppercase"
                  style={{ fontFamily: "'Source Code Pro', monospace" }}
                >
                  No data for this range
                </span>
              </div>
            )}

            {!isLoading && !error && chartData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    opacity={0.4}
                  />
                  <XAxis
                    dataKey="t"
                    tickFormatter={v => formatAxisTime(v, range)}
                    tick={{ fill: 'var(--color-muted)', fontSize: 9, fontFamily: "'Source Code Pro', monospace" }}
                    axisLine={{ stroke: 'var(--color-border)' }}
                    tickLine={false}
                    minTickGap={40}
                  />
                  <YAxis
                    tick={{ fill: 'var(--color-muted)', fontSize: 9, fontFamily: "'Source Code Pro', monospace" }}
                    axisLine={false}
                    tickLine={false}
                    width={42}
                  />
                  <Tooltip
                    content={<ChartTooltip unit={unit} range={range} />}
                    cursor={{ stroke: 'var(--color-accent)', strokeWidth: 1, opacity: 0.4 }}
                  />
                  {sensorThreshold?.warn?.min != null && (
                    <ReferenceLine y={sensorThreshold.warn.min} stroke="var(--color-warn)" strokeDasharray="4 4" strokeOpacity={0.7} />
                  )}
                  {sensorThreshold?.warn?.max != null && (
                    <ReferenceLine y={sensorThreshold.warn.max} stroke="var(--color-warn)" strokeDasharray="4 4" strokeOpacity={0.7} />
                  )}
                  {sensorThreshold?.critical?.min != null && (
                    <ReferenceLine y={sensorThreshold.critical.min} stroke="var(--color-crit)" strokeDasharray="2 3" strokeOpacity={0.8} />
                  )}
                  {sensorThreshold?.critical?.max != null && (
                    <ReferenceLine y={sensorThreshold.critical.max} stroke="var(--color-crit)" strokeDasharray="2 3" strokeOpacity={0.8} />
                  )}
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke="var(--color-accent)"
                    strokeWidth={1.75}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      if (cx == null || cy == null || !payload) return null;
                      return <circle cx={cx} cy={cy} r={2.5} fill={dotColor(payload.severity)} stroke="none" />;
                    }}
                    activeDot={{ r: 3, fill: 'var(--color-accent)', strokeWidth: 0 }}
                    shape={({ points }) => {
                      if (!points || points.length < 2) return null;
                      const gradIds = [];
                      const lines = [];
                      for (let i = 0; i < points.length - 1; i++) {
                        const a = points[i];
                        const b = points[i + 1];
                        if (a.x == null || a.y == null || b.x == null || b.y == null) continue;
                        const sevA = chartData[i]?.severity ?? 'OK';
                        const sevB = chartData[i + 1]?.severity ?? 'OK';
                        const colorA = dotColor(sevA);
                        const colorB = dotColor(sevB);
                        if (colorA === colorB) {
                          lines.push(<line key={`seg-${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={colorA} strokeWidth={1.75} />);
                        } else {
                          const gid = `seg-grad-${i}`;
                          gradIds.push(
                            <linearGradient key={gid} id={gid} x1={a.x} y1={a.y} x2={b.x} y2={b.y} gradientUnits="userSpaceOnUse">
                              <stop offset="0%" stopColor={colorA} />
                              <stop offset="100%" stopColor={colorB} />
                            </linearGradient>
                          );
                          lines.push(<line key={`seg-${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={`url(#${gid})`} strokeWidth={1.75} />);
                        }
                      }
                      return (
                        <g>
                          <defs>{gradIds}</defs>
                          {lines}
                        </g>
                      );
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-2.5 border-t border-border/50 flex items-center justify-between">
            <span
              className="text-muted text-[9px] tracking-widest uppercase"
              style={{ fontFamily: "'Source Code Pro', monospace" }}
            >
              {chartData.length} point{chartData.length !== 1 ? 's' : ''}
              {meta?.granularity ? ` · ${meta.granularity}` : ''}
            </span>
            {zoneId && (
              <span
                className="text-muted text-[9px]"
                style={{ fontFamily: "'Source Code Pro', monospace" }}
              >
                zone: {zoneId}
              </span>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

HistoricalTrendPanel.propTypes = {
  sensorKey:    PropTypes.string.isRequired,
  greenhouseId: PropTypes.string,
  zoneId:       PropTypes.string,
  onClose:      PropTypes.func.isRequired,
};

HistoricalTrendPanel.defaultProps = {
  greenhouseId: '',
  zoneId:       '',
};
