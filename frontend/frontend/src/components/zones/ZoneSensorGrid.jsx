import PropTypes from 'prop-types';

const SENSOR_FIELDS = [
  ['air_temp', 'AIR TEMP'],
  ['air_hum', 'AIR HUM'],
  ['soil_moist', 'SOIL MOIST'],
  ['soil_temp', 'SOIL TEMP'],
  ['soil_cond', 'SOIL COND'],
  ['soil_ph', 'SOIL PH'],
  ['soil_n', 'SOIL N'],
  ['soil_p', 'SOIL P'],
  ['soil_k', 'SOIL K'],
  ['soil_salinity', 'SALINITY'],
  ['soil_tds', 'SOIL TDS'],
];

function formatValue(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '--';
  }

  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(2);
}

export default function ZoneSensorGrid({ metrics }) {
  return (
    <div>
      <h3
        className="text-xs uppercase tracking-[0.14em] text-muted"
        style={{ fontFamily: "'Source Code Pro', monospace" }}
      >
        Sensor Readings
      </h3>

      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {SENSOR_FIELDS.map(([key, label]) => (
          <article key={key} className="rounded border border-border bg-surface2/35 px-3 py-2">
            <p
              className="text-[11px] uppercase tracking-[0.12em] text-muted"
              style={{ fontFamily: "'Source Code Pro', monospace" }}
            >
              {label}
            </p>
            <p className="mt-1 text-lg font-semibold text-ink">{formatValue(metrics[key])}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

ZoneSensorGrid.propTypes = {
  metrics: PropTypes.objectOf(PropTypes.number).isRequired,
};
