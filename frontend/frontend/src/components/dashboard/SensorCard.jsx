import PropTypes from 'prop-types';
import FreshnessIndicator from './FreshnessIndicator';
import { useDataFreshness } from '../../hooks/useDataFreshness';

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

const STATUS_CFG = {
  OK:       { pill: 'bg-accent/15 text-accent border-accent/25',  label: 'OK'       },
  INFO:     { pill: 'bg-accent/15 text-accent border-accent/25',  label: 'OK'       },
  WARNING:  { pill: 'bg-warn/15 text-warn border-warn/25',        label: 'Warning'  },
  WARN:     { pill: 'bg-warn/15 text-warn border-warn/25',        label: 'Warning'  },
  CRITICAL: { pill: 'bg-crit/15 text-crit border-crit/25',       label: 'Critical' },
  ERR:      { pill: 'bg-crit/15 text-crit border-crit/25',       label: 'Critical' },
};

function formatValue(val) {
  if (val == null || typeof val !== 'number') return '—';
  if (val >= 100) return val.toFixed(0);
  if (val >= 10)  return val.toFixed(1);
  return val.toFixed(2);
}

export default function SensorCard({ reading, index, onClick }) {
  const { isStale } = useDataFreshness(reading.lastUpdatedAt);
  const label = SENSOR_LABELS[reading.sensor_key] ?? reading.sensor_key;
  const cfg   = STATUS_CFG[reading.status] ?? STATUS_CFG.OK;

  return (
    <div
      onClick={onClick}
      style={{ animationDelay: `${index * 60}ms` }}
      className={[
        'relative flex flex-col bg-surface2 rounded-2xl overflow-hidden',
        'animate-[fadeUp_0.35s_ease_both]',
        isStale ? 'opacity-55' : 'opacity-100',
        'transition-opacity duration-500',
        onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : '',
      ].join(' ')}
    >
      {/* Value + label */}
      <div className="flex-1 px-5 pt-5 pb-4">
        <div className="flex items-baseline gap-2">
          <span
            className="text-ink font-semibold leading-none"
            style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 'clamp(1.9rem, 3vw, 2.75rem)' }}
          >
            {formatValue(reading.value)}
          </span>
          <span
            className="text-muted text-xs leading-none mb-0.5"
            style={{ fontFamily: "'Source Code Pro', monospace" }}
          >
            {reading.unit}
          </span>
        </div>

        <span className="block text-ink/70 text-sm mt-2.5 leading-snug font-medium">
          {label}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-2.5 border-t border-border/40">
        <FreshnessIndicator timestamp={reading.lastUpdatedAt} />
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${cfg.pill}`}>
          {cfg.label}
        </span>
      </div>
    </div>
  );
}

SensorCard.propTypes = {
  reading: PropTypes.shape({
    sensor_key:    PropTypes.string.isRequired,
    value:         PropTypes.number.isRequired,
    unit:          PropTypes.string.isRequired,
    status:        PropTypes.string.isRequired,
    lastUpdatedAt: PropTypes.string.isRequired,
  }).isRequired,
  index:   PropTypes.number.isRequired,
  onClick: PropTypes.func,
};

SensorCard.defaultProps = { onClick: null };
