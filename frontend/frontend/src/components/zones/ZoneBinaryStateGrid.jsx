import PropTypes from 'prop-types';

function toHigh(value) {
  return Number(value) >= 0.5;
}

export default function ZoneBinaryStateGrid({ title, keys, metrics }) {
  return (
    <div>
      <h3
        className="text-xs uppercase tracking-[0.14em] text-muted"
        style={{ fontFamily: "'Source Code Pro', monospace" }}
      >
        {title}
      </h3>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {keys.map((key) => {
          const high = toHigh(metrics[key]);
          return (
            <article
              key={key}
              className={`rounded border px-3 py-2 ${high ? 'border-accent/60 bg-accent/10' : 'border-border bg-surface2/30'}`}
            >
              <p className="font-mono text-sm font-semibold text-ink">[{key.toUpperCase()}]</p>
              <p className={`mt-1 text-xs font-semibold ${high ? 'text-accent' : 'text-muted'}`}>
                {high ? 'HIGH' : 'LOW'}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

ZoneBinaryStateGrid.propTypes = {
  title: PropTypes.string.isRequired,
  keys: PropTypes.arrayOf(PropTypes.string).isRequired,
  metrics: PropTypes.objectOf(PropTypes.number).isRequired,
};
