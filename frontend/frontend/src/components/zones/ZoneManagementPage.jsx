import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useZoneRegistry } from '../../hooks/useZoneRegistry';
import ZoneDeviceModal from './ZoneDeviceModal';
import ZoneThresholdModal from './ZoneThresholdModal';

const mono  = { fontFamily: "'Source Code Pro', monospace" };
const serif = { fontFamily: "'Playfair Display', Georgia, serif" };

const OFFLINE_AFTER_MS = 60_000;
const AVAILABILITY_FILTERS = [
  { value: 'LIVE',    label: 'Live'    },
  { value: 'OFFLINE', label: 'Offline' },
  { value: 'ALL',     label: 'All'     },
];

function isDeviceLive(lastSeenAt) {
  if (!lastSeenAt) return false;
  const seenAt = new Date(lastSeenAt).getTime();
  if (Number.isNaN(seenAt)) return false;
  return Date.now() - seenAt <= OFFLINE_AFTER_MS;
}

function withAvailability(device) {
  const live = isDeviceLive(device?.last_seen_at);
  return { ...device, is_live: live, availability: live ? 'LIVE' : 'OFFLINE' };
}

function matchesAvailability(device, filter) {
  return filter === 'ALL' ? true : device.availability === filter;
}

function emptyListMessage(filter, section) {
  if (section === 'discovered') {
    if (filter === 'LIVE')    return 'No live discovered devices right now.';
    if (filter === 'OFFLINE') return 'No offline discovered devices right now.';
    return 'No discovered devices right now.';
  }
  if (filter === 'LIVE')    return 'No live assigned zones right now.';
  if (filter === 'OFFLINE') return 'No offline assigned zones right now.';
  return 'No assigned zones yet.';
}

function formatTimestamp(value) {
  if (!value) return 'n/a';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'n/a';
  return date.toLocaleString();
}

export default function ZoneManagementPage({ greenhouseId }) {
  const { registry, loading, pending, error, refresh, assign, unassign, rename, sync } =
    useZoneRegistry({ greenhouseId });

  const [assignDrafts,     setAssignDrafts]     = useState({});
  const [renameDrafts,     setRenameDrafts]     = useState({});
  const [message,          setMessage]          = useState('');
  const [selectedDevice,   setSelectedDevice]   = useState(null);
  const [thresholdsZone,   setThresholdsZone]   = useState(null);
  const [availabilityFilter, setAvailabilityFilter] = useState('LIVE');

  const discoveredDevices = useMemo(
    () => (registry?.discovered_devices ?? []).map(withAvailability),
    [registry]
  );
  const assignedZones = useMemo(
    () => (registry?.assigned_zones ?? []).map(withAvailability),
    [registry]
  );
  const filteredDiscovered = useMemo(
    () => discoveredDevices.filter(d => matchesAvailability(d, availabilityFilter)),
    [availabilityFilter, discoveredDevices]
  );
  const filteredAssigned = useMemo(
    () => assignedZones.filter(z => matchesAvailability(z, availabilityFilter)),
    [assignedZones, availabilityFilter]
  );

  const handleAssign = async (deviceId) => {
    const draftName = (assignDrafts[deviceId] ?? '').trim();
    await assign({ deviceId, zoneName: draftName || undefined });
    setAssignDrafts(prev => ({ ...prev, [deviceId]: '' }));
    setMessage(`Assigned device ${deviceId} to a zone.`);
  };

  const handleRename = async (deviceId, zoneId, currentZoneName) => {
    const draftName  = (renameDrafts[deviceId] ?? '').trim();
    const nextZoneName = draftName || currentZoneName;
    if (!nextZoneName) return;
    await rename({ deviceId, zoneId, zoneName: nextZoneName });
    setRenameDrafts(prev => ({ ...prev, [deviceId]: '' }));
    setMessage(`Updated zone name for device ${deviceId}.`);
  };

  const handleUnassign = async (deviceId) => {
    await unassign(deviceId);
    setMessage(`Unassigned device ${deviceId}.`);
  };

  const handleSync = async () => {
    await sync();
    setMessage('Published full zone registry sync to gateway.');
  };

  const openDeviceModal  = (device) => { setSelectedDevice(device); setMessage(''); };
  const closeDeviceModal = () => setSelectedDevice(null);

  const statusPill = (isLive) =>
    isLive
      ? 'bg-accent/10 text-accent border-accent/25'
      : 'bg-warn/10  text-warn  border-warn/25';

  return (
    <div className="min-h-screen bg-bg">

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-surface border-b border-border">
        <div className="flex items-center justify-between px-5 sm:px-8 h-16 max-w-7xl mx-auto">

          <div className="min-w-0">
            <a
              href="/g"
              style={serif}
              className="text-base sm:text-lg text-ink hover:text-accent transition-colors leading-tight block truncate"
            >
              Greenhouse Management System
            </a>
            <p className="text-xs text-muted leading-none mt-0.5 truncate" style={mono}>
              greenhouse / {registry?.greenhouse_id ?? greenhouseId ?? 'n/a'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-4">
            <a
              href="/g"
              className="hidden sm:flex items-center gap-1 rounded-full border border-border px-4 h-8 text-sm text-muted hover:text-ink transition-colors"
            >
              ← Greenhouses
            </a>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={pending}
              className="rounded-full border border-border px-4 h-8 text-sm text-muted hover:text-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void handleSync()}
              disabled={pending}
              className="rounded-full bg-ink text-surface px-4 h-8 text-sm font-semibold hover:bg-soil transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Sync
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 sm:px-7 py-6 flex flex-col gap-5">

        {/* Feedback banners */}
        {error && (
          <div className="rounded-xl bg-crit/10 border border-crit/25 px-4 py-3 text-sm text-crit">
            {error}
          </div>
        )}
        {!error && message && (
          <div className="rounded-xl bg-accent/10 border border-accent/25 px-4 py-3 text-sm text-ink">
            {message}
          </div>
        )}

        {/* ── Availability filter ───────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 bg-surface rounded-2xl px-5 py-3">
          <span className="text-sm text-muted mr-1">Filter</span>
          {AVAILABILITY_FILTERS.map(opt => {
            const active = availabilityFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAvailabilityFilter(opt.value)}
                className={`px-4 h-7 rounded-full text-xs font-semibold transition-colors ${
                  active ? 'bg-ink text-surface' : 'text-muted hover:text-ink'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* ── Two-column layout ─────────────────────────────────── */}
        <div className="grid gap-5 lg:grid-cols-2">

          {/* Discovered Devices */}
          <section className="bg-surface rounded-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border/50">
              <h2 className="text-xl text-ink leading-none" style={serif}>Discovered Devices</h2>
              <p className="text-xs text-muted mt-1">Unassigned devices announcing to this gateway</p>
            </div>

            <div className="p-4 flex flex-col gap-3 flex-1">
              {loading ? (
                <p className="text-sm text-muted py-8 text-center">Loading…</p>
              ) : filteredDiscovered.length === 0 ? (
                <p className="text-sm text-muted py-8 text-center">{emptyListMessage(availabilityFilter, 'discovered')}</p>
              ) : (
                filteredDiscovered.map(device => (
                  <div
                    key={device.device_id}
                    onClick={() => openDeviceModal(device)}
                    className="bg-surface2 rounded-xl p-4 cursor-pointer hover:shadow-sm transition-shadow"
                  >
                    {/* Card header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <p className="text-sm text-ink font-medium truncate" style={mono}>
                          {device.device_id}
                        </p>
                        <p className="text-xs text-muted mt-0.5" style={mono}>
                          fw / {device.firmware_version || 'unknown'}
                        </p>
                        <p className="text-xs text-muted" style={mono}>
                          seen / {formatTimestamp(device.last_seen_at)}
                        </p>
                      </div>
                      <span className={`shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full border ${statusPill(device.is_live)}`}>
                        {device.is_live ? 'Live' : 'Offline'}
                      </span>
                    </div>

                    {!device.is_live && (
                      <p className="text-xs text-warn mb-3">
                        Wait for a heartbeat before assigning
                      </p>
                    )}

                    {/* Assign row */}
                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        value={assignDrafts[device.device_id] ?? ''}
                        onChange={e => setAssignDrafts(p => ({ ...p, [device.device_id]: e.target.value }))}
                        placeholder="Zone name (optional)"
                        className="flex-1 rounded-xl border border-border bg-surface px-3 h-9 text-sm text-ink outline-none focus:border-accent transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => void handleAssign(device.device_id)}
                        disabled={pending || !device.is_live}
                        className="rounded-xl bg-soil text-surface px-4 h-9 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Assigned Zones */}
          <section className="bg-surface rounded-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border/50">
              <h2 className="text-xl text-ink leading-none" style={serif}>Assigned Zones</h2>
              <p className="text-xs text-muted mt-1">Active mappings for command routing and telemetry</p>
            </div>

            <div className="p-4 flex flex-col gap-3 flex-1">
              {loading ? (
                <p className="text-sm text-muted py-8 text-center">Loading…</p>
              ) : filteredAssigned.length === 0 ? (
                <p className="text-sm text-muted py-8 text-center">{emptyListMessage(availabilityFilter, 'assigned')}</p>
              ) : (
                filteredAssigned.map(zone => (
                  <div
                    key={zone.device_id}
                    onClick={() => openDeviceModal(zone)}
                    className="bg-surface2 rounded-xl p-4 cursor-pointer hover:shadow-sm transition-shadow"
                  >
                    {/* Card header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base text-ink font-semibold leading-snug" style={serif}>
                          {zone.zone_name || 'Unnamed zone'}
                        </p>
                        <p className="text-xs text-muted mt-0.5 truncate" style={mono}>
                          zone / {zone.zone_id}
                        </p>
                        <p className="text-xs text-muted truncate" style={mono}>
                          device / {zone.device_id}
                        </p>
                        <p className="text-xs text-muted" style={mono}>
                          seen / {formatTimestamp(zone.last_seen_at)}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${statusPill(zone.is_live)}`}>
                          {zone.is_live ? 'Live' : 'Offline'}
                        </span>
                        {/* Control / Thresholds */}
                        <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => openDeviceModal(zone)}
                            disabled={!zone.is_live}
                            className="rounded-full border border-border px-3 h-7 text-xs text-muted hover:text-ink hover:bg-surface/70 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Control
                          </button>
                          <button
                            type="button"
                            onClick={() => setThresholdsZone(zone)}
                            className="rounded-full border border-border px-3 h-7 text-xs text-muted hover:text-ink hover:bg-surface/70 transition-colors"
                          >
                            Thresholds
                          </button>
                        </div>
                      </div>
                    </div>

                    {!zone.is_live && (
                      <p className="text-xs text-warn mt-2">Offline — command control disabled</p>
                    )}

                    {/* Rename / Unassign row */}
                    <div className="mt-3 flex gap-2" onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        value={renameDrafts[zone.device_id] ?? ''}
                        onChange={e => setRenameDrafts(p => ({ ...p, [zone.device_id]: e.target.value }))}
                        placeholder="Rename zone"
                        className="flex-1 rounded-xl border border-border bg-surface px-3 h-9 text-sm text-ink outline-none focus:border-accent transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => void handleRename(zone.device_id, zone.zone_id, zone.zone_name)}
                        disabled={pending}
                        className="rounded-xl border border-border px-3 h-9 text-sm text-muted hover:text-ink hover:bg-surface/70 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleUnassign(zone.device_id)}
                        disabled={pending}
                        className="rounded-xl border border-crit/40 bg-crit/10 px-3 h-9 text-sm text-crit hover:bg-crit/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Unassign
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <ZoneDeviceModal
          isOpen={Boolean(selectedDevice)}
          onClose={closeDeviceModal}
          device={selectedDevice}
          greenhouseId={registry?.greenhouse_id ?? greenhouseId ?? ''}
          onNotify={setMessage}
        />

        <ZoneThresholdModal
          isOpen={Boolean(thresholdsZone)}
          onClose={() => setThresholdsZone(null)}
          zone={thresholdsZone}
          greenhouseId={registry?.greenhouse_id ?? greenhouseId ?? ''}
        />
      </div>
    </div>
  );
}

ZoneManagementPage.propTypes = {
  greenhouseId: PropTypes.string,
};

ZoneManagementPage.defaultProps = {
  greenhouseId: '',
};
