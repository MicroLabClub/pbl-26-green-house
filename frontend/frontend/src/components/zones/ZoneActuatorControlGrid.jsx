import PropTypes from 'prop-types';

function keyFromChannel(channel) {
  return `dout_${String(channel).padStart(2, '0')}`;
}

function isHigh(value) {
  return Number(value) >= 0.5;
}

function resolveState(metricKey, metrics, optimisticOutputs) {
  if (Object.prototype.hasOwnProperty.call(optimisticOutputs, metricKey)) {
    return Number(optimisticOutputs[metricKey]) >= 0.5 ? 1 : 0;
  }

  return isHigh(metrics[metricKey]) ? 1 : 0;
}

export default function ZoneActuatorControlGrid({
  metrics,
  optimisticOutputs,
  pendingChannels,
  disabled,
  onSetState,
}) {
  return (
    <div>
      <h3
        className="text-xs uppercase tracking-[0.14em] text-muted"
        style={{ fontFamily: "'Source Code Pro', monospace" }}
      >
        OUT_IO
      </h3>

      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, channel) => {
          const metricKey = keyFromChannel(channel);
          const high = resolveState(metricKey, metrics, optimisticOutputs) === 1;
          const pending = Boolean(pendingChannels[String(channel)]);
          const nextState = high ? 0 : 1;

          return (
            <button
              key={metricKey}
              type="button"
              onClick={() => void onSetState(channel, nextState)}
              disabled={pending || disabled}
              className={`min-h-[36px] rounded border px-2 font-mono text-xs font-semibold transition ${
                high
                  ? 'border-accent bg-accent text-white hover:brightness-110'
                  : 'border-border bg-surface text-ink hover:bg-surface2'
              } disabled:cursor-not-allowed disabled:opacity-55`}
            >
              [{metricKey.toUpperCase()}]
            </button>
          );
        })}
      </div>
    </div>
  );
}

ZoneActuatorControlGrid.propTypes = {
  metrics: PropTypes.objectOf(PropTypes.number).isRequired,
  optimisticOutputs: PropTypes.objectOf(PropTypes.number).isRequired,
  pendingChannels: PropTypes.objectOf(PropTypes.bool).isRequired,
  disabled: PropTypes.bool,
  onSetState: PropTypes.func.isRequired,
};

ZoneActuatorControlGrid.defaultProps = {
  disabled: false,
};
