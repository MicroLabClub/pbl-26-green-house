import PropTypes from 'prop-types';

function formatTimestamp(value) {
  if (!value) {
    return 'n/a';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'n/a';
  }

  return date.toLocaleString();
}

function statusStyles(status) {
  switch (status) {
    case 'APPLIED':
      return 'border-accent/45 bg-accent/10 text-accent';
    case 'FORWARDED':
      return 'border-accent/25 bg-surface2/45 text-ink';
    case 'FAILED':
    case 'ERROR':
      return 'border-crit/40 bg-crit/10 text-crit';
    case 'TIMEOUT':
    case 'PENDING':
      return 'border-warn/40 bg-warn/10 text-warn';
    default:
      return 'border-border bg-surface2/35 text-muted';
  }
}

export default function ZoneCommandAckPanel({ ack }) {
  if (!ack) {
    return null;
  }

  const status = String(ack.status || 'PENDING').toUpperCase();
  const reason = typeof ack.reason === 'string' ? ack.reason.trim() : '';

  return (
    <section className={`rounded border px-3 py-2 ${statusStyles(status)}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3
          className="text-xs uppercase tracking-[0.14em]"
          style={{ fontFamily: "'Source Code Pro', monospace" }}
        >
          Command ACK
        </h3>
        <span className="rounded border border-current/30 px-2 py-0.5 text-[10px] font-semibold">
          {status}
        </span>
      </div>

      <p className="mt-1.5 font-mono text-[11px] break-all">command_id: {ack.command_id || 'n/a'}</p>
      {(ack.device_id || ack.zone_id) && (
        <p className="mt-0.5 text-[11px]">
          {ack.device_id ? `device: ${ack.device_id}` : 'device: n/a'}
          {ack.zone_id ? ` | zone: ${ack.zone_id}` : ''}
        </p>
      )}
      {reason && <p className="mt-1 text-xs">{reason}</p>}
      <p className="mt-1 text-[11px]">updated: {formatTimestamp(ack.timestamp)}</p>
    </section>
  );
}

ZoneCommandAckPanel.propTypes = {
  ack: PropTypes.shape({
    command_id: PropTypes.string,
    status: PropTypes.string,
    reason: PropTypes.string,
    timestamp: PropTypes.string,
    device_id: PropTypes.string,
    zone_id: PropTypes.string,
  }),
};

ZoneCommandAckPanel.defaultProps = {
  ack: null,
};
