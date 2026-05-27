import PropTypes from 'prop-types';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import SensorDashboard from '../dashboard/SensorDashboard';
import ZoneLayers from '../dashboard/ZoneLayers';
import GlobalFeedStatus from '../dashboard/GlobalFeedStatus';
import MobileNav from './MobileNav';
import AlertPanel from '../alerts/AlertPanel';
import IrrigationControlPanel from '../irrigation/IrrigationControlPanel';
import { useSensorData } from '../../hooks/useSensorData';
import { useAlerts } from '../../hooks/useAlerts';
import { useIrrigation } from '../../hooks/useIrrigation';
import { useZoneRegistry } from '../../hooks/useZoneRegistry';

const serif = { fontFamily: "'Playfair Display', Georgia, serif" };
const mono  = { fontFamily: "'Source Code Pro', monospace" };

export default function AppShell({ greenhouseId }) {
  const [activeView, setActiveView] = useState('sensors');
  const [manualZoneId, setManualZoneId] = useState('');

  const { registry } = useZoneRegistry({ greenhouseId });
  const assignedZones = useMemo(
    () => registry.assigned_zones ?? [],
    [registry.assigned_zones],
  );

  const zoneNameMap = useMemo(
    () => Object.fromEntries(assignedZones.map(z => [z.zone_id, z.zone_name])),
    [assignedZones],
  );

  const selectedZone = assignedZones.find(z => z.zone_id === manualZoneId) ?? null;
  const selectedZoneId = selectedZone?.zone_id ?? '';

  const readings = useSensorData({
    greenhouseId,
    zoneId: selectedZoneId,
    enabled: !!greenhouseId,
  });

  const { alerts, acknowledge, dismiss } = useAlerts({ greenhouseId });
  const { zones: irrigationZones, loading: irrigationLoading, toggleZone, manualOverride, emergencyStop } = useIrrigation(greenhouseId);

  const unackedCount = alerts.filter(a => !a.acknowledged).length;

  const tabCls = (view) =>
    `px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors whitespace-nowrap ${
      activeView === view
        ? 'bg-surface2 text-ink'
        : 'text-muted hover:text-ink'
    }`;

  return (
    <div className="flex flex-col h-full min-h-screen">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="shrink-0 z-20 border-b border-border bg-surface">
        <div className="flex items-center justify-between px-5 sm:px-8 h-16">

          {/* Title → links to greenhouse list */}
          <a href="/g" className="flex flex-col justify-center group">
            <span
              className="text-ink font-semibold leading-tight group-hover:text-accent transition-colors"
              style={{ ...serif, fontSize: 'clamp(1.05rem, 2.5vw, 1.25rem)' }}
            >
              Greenhouse Management System
            </span>
            {greenhouseId && (
              <span className="text-muted text-[10px] tracking-[0.14em] uppercase mt-0.5 hidden sm:block" style={mono}>
                greenhouse / {greenhouseId}
              </span>
            )}
          </a>

          {/* Right nav */}
          <div className="flex items-center gap-2">
            <a
              href="/g"
              className="hidden sm:inline-flex items-center rounded-full border border-border px-4 h-8 text-xs font-medium text-muted hover:text-ink hover:bg-surface2 transition-colors"
            >
              Greenhouses
            </a>
            {greenhouseId && (
              <a
                href={`/g/${encodeURIComponent(greenhouseId)}/zones`}
                className="hidden sm:inline-flex items-center rounded-full border border-border px-4 h-8 text-xs font-medium text-muted hover:text-ink hover:bg-surface2 transition-colors"
              >
                Zones
              </a>
            )}
            <GlobalFeedStatus readings={readings} />
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 px-5 sm:px-8 h-11 border-t border-border/40 bg-surface">
          <button className={tabCls('sensors')} onClick={() => { if (activeView === 'sensors' && selectedZoneId) setManualZoneId(''); else setActiveView('sensors'); }}>
            Sensors
          </button>
          <button className={tabCls('irrigation')} onClick={() => setActiveView('irrigation')}>
            Irrigation
          </button>
          <button
            className={`${tabCls('notifications')} relative`}
            onClick={() => setActiveView('notifications')}
          >
            Notifications
            {unackedCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-[9px] rounded-full bg-crit text-white font-bold leading-none">
                {unackedCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <AnimatePresence mode="wait">
            {activeView === 'sensors' && !selectedZoneId && assignedZones.length > 0 && (
              <motion.div key="zone-layers" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                <ZoneLayers zones={assignedZones} onSelectZone={setManualZoneId} greenhouseId={greenhouseId} />
              </motion.div>
            )}
            {activeView === 'sensors' && (selectedZoneId || assignedZones.length === 0) && (
              <motion.div key="sensors" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                <SensorDashboard
                  readings={readings}
                  greenhouseId={greenhouseId}
                  zones={assignedZones}
                  selectedZoneId={selectedZoneId}
                  onBack={assignedZones.length > 0 ? () => setManualZoneId('') : undefined}
                />
              </motion.div>
            )}
            {activeView === 'irrigation' && (
              <motion.div key="irrigation" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                <IrrigationControlPanel
                  zones={irrigationZones}
                  loading={irrigationLoading}
                  onToggle={toggleZone}
                  onManualOverride={manualOverride}
                  onEmergencyStop={emergencyStop}
                />
              </motion.div>
            )}
            {activeView === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="h-full">
                <AlertPanel alerts={alerts} onAcknowledge={acknowledge} onDismiss={dismiss} zoneNameMap={zoneNameMap} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <MobileNav
        unackedCountCount={unackedCount}
        onOpenAlerts={() => setActiveView('notifications')}
        activeView={activeView}
        onSetView={setActiveView}
      />
    </div>
  );
}

AppShell.propTypes = { greenhouseId: PropTypes.string };
AppShell.defaultProps = { greenhouseId: '' };
