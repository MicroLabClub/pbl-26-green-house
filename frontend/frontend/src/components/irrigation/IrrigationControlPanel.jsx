import PropTypes from 'prop-types';
import { useState } from 'react';
import { motion } from 'motion/react';
import ZoneCard from './ZoneCard';

export default function IrrigationControlPanel({
  zones,
  loading,
  onToggle,
  onManualOverride,
  onEmergencyStop,
}) {
  const [selectedId, setSelectedId] = useState('');

  // Derive selected zone — fall back to first when selection becomes invalid
  const selectedZone = zones.find(z => z.id === selectedId) ?? zones[0] ?? null;

  const activeCount  = zones.filter(z => z.status === 'ACTIVE').length;
  const offlineCount = zones.filter(z => z.status === 'OFFLINE').length;
  const hasActive    = activeCount > 0;

  return (
    <div className="flex flex-col h-full">

      {/* Zone tab strip */}
      {!loading && zones.length > 0 && (
        <div
          className="shrink-0 flex items-stretch overflow-x-auto border-b border-border bg-surface scrollbar-none"
          style={{ minHeight: '36px' }}
        >
          {zones.map(z => {
            const active = z.id === (selectedZone?.id ?? '');
            const dot =
              z.status === 'ACTIVE'  ? 'bg-accent' :
              z.status === 'OFFLINE' ? 'bg-crit'   : 'bg-muted/40';
            return (
              <button
                key={z.id}
                onClick={() => setSelectedId(z.id)}
                className={`shrink-0 flex items-center gap-2 px-5 h-9 text-[9px] tracking-widest uppercase border-b-2 transition-colors whitespace-nowrap ${
                  active
                    ? 'text-accent border-accent bg-accent/5'
                    : 'text-muted border-transparent hover:text-ink hover:bg-surface2'
                }`}
                style={{ fontFamily: "'Source Code Pro', monospace" }}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                {z.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Header */}
      <div className="px-5 sm:px-7 pt-5 pb-4 border-b border-border flex items-end justify-between">
        <div>
          <h2
            className="text-ink text-xl sm:text-2xl leading-none"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Irrigation
          </h2>
          {selectedZone && (
            <p className="text-muted text-[9px] tracking-widest uppercase mt-1" style={{ fontFamily: "'Source Code Pro', monospace" }}>
              {selectedZone.label}
              {selectedZone.deviceId && ` · ${selectedZone.deviceId}`}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 mb-0.5">
          {offlineCount > 0 && (
            <span className="text-[9px] tracking-widest uppercase px-2 py-0.5 bg-crit/10 text-crit border border-crit/30 rounded-sm" style={{ fontFamily: "'Source Code Pro', monospace" }}>
              {offlineCount} offline
            </span>
          )}
          {activeCount > 0 && (
            <span className="text-[9px] tracking-widest uppercase px-2 py-0.5 bg-accent/10 text-accent border border-accent/30 rounded-sm" style={{ fontFamily: "'Source Code Pro', monospace" }}>
              {activeCount} active
            </span>
          )}
          {!hasActive && offlineCount === 0 && !loading && zones.length > 0 && (
            <span className="text-[9px] tracking-widest uppercase px-2 py-0.5 bg-muted/10 text-muted border border-muted/30 rounded-sm" style={{ fontFamily: "'Source Code Pro', monospace" }}>
              all idle
            </span>
          )}
          {hasActive && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={onEmergencyStop}
              className="text-[9px] uppercase tracking-widest px-3 py-1.5 bg-crit/10 text-crit border border-crit/40 hover:bg-crit/20 transition-colors ml-1"
              style={{ fontFamily: "'Source Code Pro', monospace" }}
            >
              Emergency Stop
            </motion.button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 sm:p-7">

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-bg border border-border h-[84px] animate-pulse" style={{ borderLeftWidth: '3px', borderLeftColor: 'var(--color-border)' }} />
            ))}
          </div>
        )}

        {/* No zones */}
        {!loading && zones.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-muted text-[10px] tracking-widest uppercase" style={{ fontFamily: "'Source Code Pro', monospace" }}>
              No irrigation zones assigned
            </span>
            <span className="text-muted text-[9px] mt-2" style={{ fontFamily: "'Source Code Pro', monospace" }}>
              Assign devices to zones first
            </span>
          </div>
        )}

        {/* Selected zone card */}
        {!loading && selectedZone && (
          <div className="max-w-sm">
            <ZoneCard
              zone={selectedZone}
              index={0}
              onToggle={onToggle}
              onManualOverride={onManualOverride}
            />
          </div>
        )}

        {/* All-zones status summary */}
        {!loading && zones.length > 1 && (
          <div className="mt-6 pt-4 border-t border-border/50">
            <p className="text-muted text-[9px] tracking-widest uppercase mb-3" style={{ fontFamily: "'Source Code Pro', monospace" }}>
              All zones
            </p>
            <div className="flex flex-wrap gap-2">
              {zones.map(z => {
                const color =
                  z.status === 'ACTIVE'  ? 'text-accent border-accent/30 bg-accent/5' :
                  z.status === 'OFFLINE' ? 'text-crit border-crit/30 bg-crit/5'       :
                  'text-muted border-border bg-surface';
                const dot =
                  z.status === 'ACTIVE'  ? 'bg-accent' :
                  z.status === 'OFFLINE' ? 'bg-crit'   : 'bg-muted/40';
                return (
                  <button
                    key={z.id}
                    onClick={() => setSelectedId(z.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 border text-[9px] tracking-widest uppercase transition-colors ${color}`}
                    style={{ fontFamily: "'Source Code Pro', monospace" }}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                    {z.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

IrrigationControlPanel.propTypes = {
  zones:            PropTypes.array.isRequired,
  loading:          PropTypes.bool.isRequired,
  onToggle:         PropTypes.func.isRequired,
  onManualOverride: PropTypes.func.isRequired,
  onEmergencyStop:  PropTypes.func.isRequired,
};
