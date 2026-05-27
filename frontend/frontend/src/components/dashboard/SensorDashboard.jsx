import PropTypes from 'prop-types';
import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import SensorCard from './SensorCard';
import HistoricalTrendPanel from './HistoricalTrendPanel';

const serif = { fontFamily: "'Playfair Display', Georgia, serif" };
const mono  = { fontFamily: "'Source Code Pro', monospace" };

const SENSOR_DISPLAY_KEYS = new Set([
  'air_temp', 'air_hum',
  'soil_moist', 'soil_temp', 'soil_cond', 'soil_ph',
  'soil_n', 'soil_p', 'soil_k', 'soil_salinity', 'soil_tds',
]);

export default function SensorDashboard({ readings, greenhouseId, zones, selectedZoneId, onBack }) {
  const [selectedKey, setSelectedKey] = useState(null);

  const sensorReadings  = readings.filter(r => SENSOR_DISPLAY_KEYS.has(r.sensor_key));
  const warnCount       = sensorReadings.filter(r => r.status === 'WARNING' || r.status === 'WARN').length;
  const criticalCount   = sensorReadings.filter(r => r.status === 'CRITICAL' || r.status === 'ERR').length;
  const selectedZone    = zones.find(z => z.zone_id === selectedZoneId) ?? null;

  return (
    <div className="flex flex-col h-full">

      {/* No zones assigned */}
      {zones.length === 0 && greenhouseId && (
        <div className="shrink-0 flex items-center gap-2 px-5 sm:px-7 py-2.5 border-b border-border bg-surface">
          <span className="text-sm text-muted">No zones assigned —</span>
          <a
            href={`/g/${encodeURIComponent(greenhouseId)}/zones`}
            className="text-sm text-accent font-medium hover:text-soil transition-colors"
          >
            Assign devices →
          </a>
        </div>
      )}

      {/* Section header */}
      <div className="px-5 sm:px-7 pt-5 pb-4 flex items-end justify-between">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-xs text-muted hover:text-ink transition-colors mb-2.5"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 19l-7-7 7-7" />
              </svg>
              All zones
            </button>
          )}
          <h2 className="text-ink text-xl sm:text-2xl leading-none" style={serif}>
            Sensor Readings
          </h2>
          {selectedZone && (
            <p className="text-muted text-xs mt-1" style={mono}>
              {selectedZone.zone_name || selectedZone.zone_id}
              {selectedZone.device_id && ` · ${selectedZone.device_id}`}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 mb-0.5">
          {criticalCount > 0 && (
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-crit/10 text-crit border border-crit/25">
              {criticalCount} critical
            </span>
          )}
          {warnCount > 0 && (
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-warn/10 text-warn border border-warn/25">
              {warnCount} warning
            </span>
          )}
          {sensorReadings.length > 0 && criticalCount === 0 && warnCount === 0 && (
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/25">
              All nominal
            </span>
          )}
          {greenhouseId && sensorReadings.length > 0 && (
            <span className="text-xs text-muted hidden sm:inline">tap for history</span>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 px-5 sm:px-7 pb-7">
        {sensorReadings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-muted text-sm">No sensor data</p>
            <p className="text-muted text-xs mt-1">
              {zones.length === 0 ? 'Assign a zone to begin' : 'Waiting for device telemetry…'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {sensorReadings.map((reading, i) => (
            <SensorCard
              key={reading.sensor_key}
              reading={reading}
              index={i}
              onClick={greenhouseId ? () => setSelectedKey(reading.sensor_key) : undefined}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedKey && (
          <HistoricalTrendPanel
            key={selectedKey}
            sensorKey={selectedKey}
            greenhouseId={greenhouseId}
            zoneId={selectedZoneId}
            onClose={() => setSelectedKey(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

SensorDashboard.propTypes = {
  readings: PropTypes.arrayOf(
    PropTypes.shape({
      sensor_key:    PropTypes.string.isRequired,
      value:         PropTypes.number.isRequired,
      unit:          PropTypes.string.isRequired,
      status:        PropTypes.string.isRequired,
      lastUpdatedAt: PropTypes.string.isRequired,
    })
  ).isRequired,
  greenhouseId:   PropTypes.string,
  zones:          PropTypes.array,
  selectedZoneId: PropTypes.string,
  onBack:         PropTypes.func,
};

SensorDashboard.defaultProps = {
  greenhouseId:   '',
  zones:          [],
  selectedZoneId: '',
  onBack:         null,
};
