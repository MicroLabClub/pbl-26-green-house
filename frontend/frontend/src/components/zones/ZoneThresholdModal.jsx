import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useZoneThresholds } from '../../hooks/useZoneThresholds';
import { useZoneDeviceTelemetry } from '../../hooks/useZoneDeviceTelemetry';

const mono  = { fontFamily: "'Source Code Pro', monospace" };
const serif = { fontFamily: "'Playfair Display', Georgia, serif" };

const SENSOR_UNITS = {
  air_temp:     '°C',
  air_hum:      '%RH',
  soil_moist:   '%',
  soil_temp:    '°C',
  soil_ph:      'pH',
  soil_cond:    'dS/m',
  soil_n:       'mg/kg',
  soil_p:       'mg/kg',
  soil_k:       'mg/kg',
  soil_salinity:'ppt',
  soil_tds:     'ppm',
};

const LEVELS = [
  {
    key: 'normal',
    label: 'Normal',
    description: 'Values within this range are healthy — no alert fired',
    border: 'border-accent/25',
    bg: 'bg-accent/8',
    text: 'text-accent',
    badgeCls: 'bg-accent/10 text-accent border-accent/25',
    focusBorder: 'focus:border-accent',
  },
  {
    key: 'warn',
    label: 'Warning',
    description: 'Values breaching this band → WARNING alert',
    border: 'border-warn/25',
    bg: 'bg-warn/8',
    text: 'text-warn',
    badgeCls: 'bg-warn/10 text-warn border-warn/25',
    focusBorder: 'focus:border-warn',
  },
  {
    key: 'critical',
    label: 'Critical',
    description: 'Values beyond this band → CRITICAL alert',
    border: 'border-crit/25',
    bg: 'bg-crit/8',
    text: 'text-crit',
    badgeCls: 'bg-crit/10 text-crit border-crit/25',
    focusBorder: 'focus:border-crit',
  },
];

function prettifySensorKey(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusTone(status) {
  switch (String(status || '').toUpperCase()) {
    case 'APPLIED': return 'bg-accent/10 text-accent border-accent/30';
    case 'FAILED':
    case 'ERROR':
    case 'TIMEOUT': return 'bg-crit/10 text-crit border-crit/30';
    case 'PENDING': return 'bg-warn/10 text-warn border-warn/30';
    default:        return 'bg-surface2 text-muted border-border';
  }
}

function hasSensorData(levels) {
  if (!levels) return false;
  return Object.values(levels).some(
    (lvl) => (lvl?.min != null && lvl?.min !== '') || (lvl?.max != null && lvl?.max !== '')
  );
}

function sensorStatusTone(status) {
  switch (String(status || '').toUpperCase()) {
    case 'CRITICAL': return { dot: 'bg-crit',   badge: 'border-crit/30 bg-crit/10 text-crit',     label: 'Critical' };
    case 'WARNING':  return { dot: 'bg-warn',   badge: 'border-warn/30 bg-warn/10 text-warn',     label: 'Warning'  };
    default:         return { dot: 'bg-accent', badge: 'border-accent/30 bg-accent/10 text-accent', label: 'OK'      };
  }
}

export default function ZoneThresholdModal({ isOpen, onClose, zone, greenhouseId }) {
  const [activeSensor, setActiveSensor] = useState(null);

  const {
    thresholds, updateField, save, saving, dirty, reset,
    loading, validationErrors, applyStatus, configVersion, error,
  } = useZoneThresholds({ greenhouseId, zoneId: zone?.zone_id });

  const { readings: liveReadings } = useZoneDeviceTelemetry({
    greenhouseId,
    zoneId: zone?.zone_id,
    enabled: Boolean(isOpen && greenhouseId && zone?.zone_id),
    pollMs: 3000,
  });

  const sensors = useMemo(
    () =>
      Object.keys(thresholds).map((key) => ({
        key,
        label: prettifySensorKey(key),
        unit: SENSOR_UNITS[key] ?? '',
      })),
    [thresholds]
  );

  const selectedSensorKey =
    activeSensor && sensors.find((s) => s.key === activeSensor)
      ? activeSensor
      : sensors[0]?.key ?? null;

  const liveReadingBySensor = useMemo(
    () => Object.fromEntries((liveReadings ?? []).map((r) => [r.sensor_key, r])),
    [liveReadings]
  );

  useEffect(() => {
    if (!isOpen) return undefined;
    const onEscape = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !zone) return null;

  const activeSensorMeta  = sensors.find((s) => s.key === selectedSensorKey);
  const activeThresholds  = selectedSensorKey ? (thresholds[selectedSensorKey] ?? {}) : {};
  const activeLiveReading = selectedSensorKey ? liveReadingBySensor[selectedSensorKey] ?? null : null;
  const activeLiveTone    = sensorStatusTone(activeLiveReading?.status);
  const status            = applyStatus?.status || (configVersion > 0 ? 'SAVED' : 'DEFAULTS');

  const handleClose = () => { if (dirty) reset(); onClose(); };
  const handleSave  = async () => { await save(); };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/30 px-3 py-6"
      onClick={handleClose}
      role="presentation"
    >
      <article
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Header ───────────────────────────────────────────────── */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-6 py-4 shrink-0">
          <div>
            <h2 className="text-xl text-ink leading-snug" style={serif}>
              Sensor Thresholds
            </h2>
            <p className="text-xs text-muted mt-0.5" style={mono}>
              zone / {zone.zone_name || zone.zone_id}
            </p>
            {dirty && (
              <p className="text-xs text-warn mt-0.5">Unsaved changes</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-3 py-1 rounded-full border ${statusTone(status)}`} style={mono}>
              v{configVersion || 0} / {status}
            </span>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !dirty || validationErrors.length > 0}
              className="rounded-full bg-soil text-surface px-4 h-8 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full border border-border px-4 h-8 text-sm text-muted hover:text-ink transition-colors"
            >
              Close
            </button>
          </div>
        </header>

        {/* ── Body ─────────────────────────────────────────────────── */}
        <div className="min-h-0 flex-1 flex overflow-hidden">

          {/* Left: sensor list */}
          <aside className="w-48 shrink-0 border-r border-border/60 overflow-y-auto p-2">
            {loading ? (
              <p className="text-sm text-muted px-2 py-4 text-center">Loading…</p>
            ) : sensors.length === 0 ? (
              <p className="text-sm text-muted px-2 py-4 text-center">No sensors available.</p>
            ) : (
              sensors.map((sensor) => {
                const isActive = sensor.key === selectedSensorKey;
                const hasData  = hasSensorData(thresholds[sensor.key]);
                const tone     = sensorStatusTone(liveReadingBySensor[sensor.key]?.status);
                return (
                  <button
                    key={sensor.key}
                    type="button"
                    onClick={() => setActiveSensor(sensor.key)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl mb-0.5 transition-colors ${
                      isActive ? 'bg-accent/10' : 'hover:bg-surface2'
                    }`}
                  >
                    <p className={`text-sm font-medium leading-snug ${isActive ? 'text-accent' : 'text-ink'}`}>
                      {sensor.label}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-muted" style={mono}>{sensor.unit || '—'}</span>
                      {hasData && (
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${tone.dot}`} />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </aside>

          {/* Right: threshold editor */}
          <div className="flex-1 overflow-y-auto p-5">

            {/* Feedback banners */}
            {(error || validationErrors.length > 0 || applyStatus?.reason) && (
              <div className="mb-4 rounded-xl border border-border bg-surface2 px-4 py-3 text-sm">
                {error && <p className="text-crit">{error}</p>}
                {!error && validationErrors.slice(0, 3).map((item) => (
                  <p key={item} className="text-warn">{item}</p>
                ))}
                {!error && validationErrors.length > 3 && (
                  <p className="text-warn">{validationErrors.length - 3} more validation issues</p>
                )}
                {!error && validationErrors.length === 0 && applyStatus?.reason && (
                  <p className="text-muted">{applyStatus.reason}</p>
                )}
              </div>
            )}

            {!activeSensorMeta ? (
              <div className="flex items-center justify-center h-full py-16">
                <p className="text-sm text-muted text-center">Select a sensor on the left.</p>
              </div>
            ) : (
              <>
                {/* Sensor heading + live reading */}
                <div className="mb-5">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <h3 className="text-lg text-ink" style={serif}>
                      {activeSensorMeta.label}
                    </h3>
                    {activeSensorMeta.unit && (
                      <span className="text-xs text-muted" style={mono}>({activeSensorMeta.unit})</span>
                    )}
                  </div>

                  {activeLiveReading ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${activeLiveTone.badge}`}>
                        {activeLiveTone.label}
                      </span>
                      <span className="text-sm text-ink font-medium" style={mono}>
                        {Number(activeLiveReading.value).toFixed(2)}{' '}
                        <span className="text-muted text-xs">{activeLiveReading.unit || activeSensorMeta.unit}</span>
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-muted mt-1">No live reading available.</p>
                  )}

                  <p className="text-xs text-muted mt-2">
                    Set min / max bounds per alert level. Leave blank to disable that level.
                  </p>
                </div>

                {/* Level cards */}
                <div className="flex flex-col gap-3">
                  {LEVELS.map((level) => {
                    const levelData = activeThresholds[level.key] ?? { min: '', max: '' };
                    return (
                      <div key={level.key} className={`rounded-xl border ${level.border} ${level.bg} p-4`}>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${level.badgeCls}`}>
                            {level.label}
                          </span>
                          <p className="text-xs text-muted">{level.description}</p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <label className="flex flex-col gap-1 flex-1 min-w-[100px]">
                            <span className="text-xs text-muted">
                              Min{activeSensorMeta.unit ? ` (${activeSensorMeta.unit})` : ''}
                            </span>
                            <input
                              type="number"
                              step="any"
                              value={levelData.min ?? ''}
                              onChange={(e) => updateField(selectedSensorKey, level.key, 'min', e.target.value)}
                              placeholder="—"
                              className={`rounded-xl border border-border bg-surface px-3 h-10 text-sm text-ink outline-none transition-colors ${level.focusBorder}`}
                              style={mono}
                            />
                          </label>

                          <label className="flex flex-col gap-1 flex-1 min-w-[100px]">
                            <span className="text-xs text-muted">
                              Max{activeSensorMeta.unit ? ` (${activeSensorMeta.unit})` : ''}
                            </span>
                            <input
                              type="number"
                              step="any"
                              value={levelData.max ?? ''}
                              onChange={(e) => updateField(selectedSensorKey, level.key, 'max', e.target.value)}
                              placeholder="—"
                              className={`rounded-xl border border-border bg-surface px-3 h-10 text-sm text-ink outline-none transition-colors ${level.focusBorder}`}
                              style={mono}
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}

ZoneThresholdModal.propTypes = {
  isOpen:       PropTypes.bool.isRequired,
  onClose:      PropTypes.func.isRequired,
  zone: PropTypes.shape({
    zone_id:   PropTypes.string,
    zone_name: PropTypes.string,
    device_id: PropTypes.string,
  }),
  greenhouseId: PropTypes.string.isRequired,
};

ZoneThresholdModal.defaultProps = {
  zone: null,
};
