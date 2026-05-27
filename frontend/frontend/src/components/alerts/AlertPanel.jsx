import PropTypes from 'prop-types';
import { AnimatePresence } from 'motion/react';
import AlertItem from './AlertItem';

export default function AlertPanel({ alerts, onAcknowledge, onDismiss, onClose, zoneNameMap }) {
  const critCount = alerts.filter(a => a.severity === 'CRITICAL' && !a.acknowledged).length;
  const warnCount = alerts.filter(a => a.severity === 'WARNING'  && !a.acknowledged).length;

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 border-b border-border bg-surface">
        <div className="flex items-center justify-between px-5 py-3">
          <h3
            className="text-ink text-base leading-none"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Event Log
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted hover:text-ink transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex border-t border-border/50">
          <span className={`flex-1 text-center py-1.5 text-[9px] tracking-widest uppercase border-r border-border/50 ${critCount > 0 ? 'text-crit bg-crit/8' : 'text-muted'}`}
            style={{ fontFamily: "'Source Code Pro', monospace" }}>
            {critCount} critical
          </span>
          <span className={`flex-1 text-center py-1.5 text-[9px] tracking-widest uppercase ${warnCount > 0 ? 'text-warn bg-warn/8' : 'text-muted'}`}
            style={{ fontFamily: "'Source Code Pro', monospace" }}>
            {warnCount} warning
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 bg-bg">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <span className="text-muted text-sm opacity-50" style={{ fontFamily: "'Zilla Slab', Georgia, serif" }}>
              No active events
            </span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {alerts.map(alert => (
              <AlertItem key={alert.id} alert={alert} onAcknowledge={onAcknowledge} onDismiss={onDismiss} zoneNameMap={zoneNameMap} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

AlertPanel.propTypes = {
  alerts: PropTypes.arrayOf(
    PropTypes.shape({
      id:           PropTypes.string.isRequired,
      severity:     PropTypes.oneOf(['CRITICAL', 'WARNING', 'INFO']).isRequired,
      sensor_key:   PropTypes.string.isRequired,
      message:      PropTypes.string.isRequired,
      triggered_at: PropTypes.string.isRequired,
      acknowledged: PropTypes.bool.isRequired,
    })
  ).isRequired,
  onAcknowledge: PropTypes.func.isRequired,
  onDismiss:     PropTypes.func.isRequired,
  onClose:       PropTypes.func,
  zoneNameMap:   PropTypes.object,
};

AlertPanel.defaultProps = { onClose: null, zoneNameMap: {} };
