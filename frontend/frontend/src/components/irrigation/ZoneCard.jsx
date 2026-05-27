import PropTypes from 'prop-types';
import { motion } from 'motion/react';
import CountdownTimer from './CountdownTimer';

const STATUS_CFG = {
  ACTIVE:  { pill: 'bg-accent/10 text-accent border-accent/30', bar: 'var(--color-accent)' },
  IDLE:    { pill: 'bg-muted/10  text-muted  border-muted/30',  bar: 'var(--color-border)' },
  OFFLINE: { pill: 'bg-crit/10  text-crit   border-crit/30',   bar: 'var(--color-crit)'   },
};

function formatRelative(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export default function ZoneCard({ zone, index, onToggle, onManualOverride }) {
  const cfg = STATUS_CFG[zone.status] ?? STATUS_CFG.IDLE;
  const isActive  = zone.status === 'ACTIVE';
  const isOffline = zone.status === 'OFFLINE';
  const inCountdown = typeof zone.countdown === 'number' && zone.countdown > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="bg-bg border border-border overflow-hidden"
      style={{ borderLeftColor: cfg.bar, borderLeftWidth: '3px' }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between px-3 pt-3 pb-2">
        <div className="flex-1 min-w-0 pr-2">
          <span
            className="block text-ink text-sm leading-snug truncate"
            style={{ fontFamily: "'Zilla Slab', Georgia, serif" }}
          >
            {zone.label}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-[9px] tracking-widest uppercase px-1.5 py-0.5 border rounded-sm ${cfg.pill}`}
              style={{ fontFamily: "'Source Code Pro', monospace" }}
            >
              {zone.status}
            </span>
            {inCountdown && (
              <span className="flex items-center gap-1">
                <span
                  className="text-[9px] text-warn uppercase tracking-widest"
                  style={{ fontFamily: "'Source Code Pro', monospace" }}
                >
                  override
                </span>
                <CountdownTimer seconds={zone.countdown} />
              </span>
            )}
          </div>
        </div>

        <button
          disabled={isOffline}
          onClick={() => onToggle(zone.id, !isActive)}
          className={`shrink-0 min-w-[52px] text-center text-[9px] uppercase tracking-widest px-2 py-1.5 border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
            isActive
              ? 'bg-crit/10 text-crit border-crit/40 hover:bg-crit/20'
              : 'bg-accent/10 text-accent border-accent/40 hover:bg-accent/20'
          }`}
          style={{ fontFamily: "'Source Code Pro', monospace" }}
        >
          {isActive ? 'Stop' : 'Run'}
        </button>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 px-3 pb-2.5 border-t border-border/40 pt-2">
        <span
          className="text-[9px] text-muted truncate"
          style={{ fontFamily: "'Source Code Pro', monospace" }}
          title={zone.deviceId}
        >
          {zone.deviceId}
        </span>
        <span
          className="text-[9px] text-muted ml-auto shrink-0"
          style={{ fontFamily: "'Source Code Pro', monospace" }}
        >
          {formatRelative(zone.lastSeenAt)}
        </span>

        {!isActive && !isOffline && !inCountdown && (
          <button
            onClick={() => onManualOverride(zone.id)}
            className="text-[9px] uppercase tracking-widest text-warn border border-warn/30 bg-warn/5 hover:bg-warn/15 px-1.5 py-0.5 transition-colors ml-1 shrink-0"
            style={{ fontFamily: "'Source Code Pro', monospace" }}
          >
            30s
          </button>
        )}
      </div>
    </motion.div>
  );
}

ZoneCard.propTypes = {
  zone: PropTypes.shape({
    id:          PropTypes.string.isRequired,
    zoneId:      PropTypes.string,
    label:       PropTypes.string.isRequired,
    deviceId:    PropTypes.string,
    status:      PropTypes.oneOf(['ACTIVE', 'IDLE', 'OFFLINE']).isRequired,
    countdown:   PropTypes.number,
    lastSeenAt:  PropTypes.string,
  }).isRequired,
  index:            PropTypes.number.isRequired,
  onToggle:         PropTypes.func.isRequired,
  onManualOverride: PropTypes.func.isRequired,
};
