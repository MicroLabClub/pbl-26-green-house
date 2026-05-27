import PropTypes from 'prop-types';
import { motion } from 'motion/react';

const SEV = {
  CRITICAL: {
    bandColor: 'var(--color-crit)',
    badge: 'bg-crit/10 text-crit border-crit/30',
    msg: 'text-crit',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <circle cx="12" cy="16" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  WARNING: {
    bandColor: 'var(--color-warn)',
    badge: 'bg-warn/10 text-warn border-warn/30',
    msg: 'text-warn',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <circle cx="12" cy="17" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  INFO: {
    bandColor: 'var(--color-accent)',
    badge: 'bg-accent/10 text-accent border-accent/30',
    msg: 'text-accent',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="11" x2="12" y2="16" />
        <circle cx="12" cy="8" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
};

function formatTime(iso) {
  try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }); }
  catch { return ''; }
}

export default function AlertItem({ alert, onAcknowledge, onDismiss, zoneNameMap }) {
  const cfg = SEV[alert.severity] ?? SEV.WARNING;
  const isCritical = alert.severity === 'CRITICAL';
  const sensorKey = alert.sensor_key || 'unknown_sensor';
  const zoneName = zoneNameMap?.[alert.zone_id];
  const context = [zoneName, alert.zone_id, alert.device_id].filter(Boolean).join(' / ');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ x: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.22 }}
      className={`relative flex mb-2 bg-surface border border-border overflow-hidden rounded-sm transition-opacity duration-300 ${alert.acknowledged ? 'opacity-40' : 'opacity-100'}`}
    >
      {/* Left colour band — consistent 4px for all severities */}
      <motion.div
        className="w-1 shrink-0 self-stretch"
        style={{ backgroundColor: cfg.bandColor }}
        animate={isCritical && !alert.acknowledged ? { opacity: [1, 0.2, 1] } : { opacity: 1 }}
        transition={isCritical ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : {}}
      />

      {/* Icon */}
      <div className={`flex items-start pt-3.5 pl-3 ${cfg.msg} ${alert.acknowledged ? 'opacity-50' : ''}`}>
        {cfg.icon}
      </div>

      {/* Content */}
      <div className="flex-1 px-3 pt-3 pb-3 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[8px] tracking-widest uppercase px-1.5 py-0.5 border rounded-sm ${cfg.badge}`}
            style={{ fontFamily: "'Source Code Pro', monospace" }}>
            {alert.severity}
          </span>
          <span className="text-[9px] text-muted truncate" style={{ fontFamily: "'Source Code Pro', monospace" }}>
            {sensorKey.replace(/_/g, '.')}
          </span>
          <span className="text-[9px] text-muted/60 ml-auto shrink-0" style={{ fontFamily: "'Source Code Pro', monospace" }}>
            {formatTime(alert.triggered_at)}
          </span>
        </div>

        <p className={`text-[12px] leading-snug ${cfg.msg}`} style={{ fontFamily: "'Zilla Slab', Georgia, serif" }}>
          {alert.message}
        </p>

        {(context || alert.threshold_version || alert.current_value != null) && (
          <p className="mt-1.5 text-[9px] text-muted" style={{ fontFamily: "'Source Code Pro', monospace" }}>
            {context && <span>{context}</span>}
            {context && (alert.threshold_version || alert.current_value != null) && <span> · </span>}
            {alert.threshold_version && <span>threshold v{alert.threshold_version}</span>}
            {alert.threshold_version && alert.current_value != null && <span> · </span>}
            {alert.current_value != null && <span>value {Number(alert.current_value).toFixed(2)}</span>}
          </p>
        )}

        <div className="flex gap-1.5 mt-2.5">
          {!alert.acknowledged ? (
            <button
              onClick={() => onAcknowledge(alert.id)}
              className="text-[9px] tracking-widest uppercase px-2.5 py-1 border border-border text-muted hover:border-accent hover:text-accent transition-colors rounded-sm min-h-[28px]"
              style={{ fontFamily: "'Source Code Pro', monospace" }}
            >
              acknowledge
            </button>
          ) : (
            <button
              onClick={() => onDismiss(alert.id)}
              className="text-[9px] tracking-widest uppercase px-2.5 py-1 border border-border text-muted hover:border-crit hover:text-crit transition-colors rounded-sm min-h-[28px]"
              style={{ fontFamily: "'Source Code Pro', monospace" }}
            >
              dismiss
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

AlertItem.propTypes = {
  alert: PropTypes.shape({
    id:           PropTypes.string.isRequired,
    severity:     PropTypes.oneOf(['CRITICAL', 'WARNING', 'INFO']).isRequired,
    sensor_key:   PropTypes.string,
    zone_id:      PropTypes.string,
    device_id:    PropTypes.string,
    threshold_version: PropTypes.number,
    current_value: PropTypes.number,
    message:      PropTypes.string.isRequired,
    triggered_at: PropTypes.string.isRequired,
    acknowledged: PropTypes.bool.isRequired,
  }).isRequired,
  onAcknowledge: PropTypes.func.isRequired,
  onDismiss:     PropTypes.func.isRequired,
  zoneNameMap:   PropTypes.object,
};
