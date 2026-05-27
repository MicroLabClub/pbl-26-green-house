import PropTypes from 'prop-types';
import { useEffect, useMemo } from 'react';
import { useZoneDeviceControls } from '../../hooks/useZoneDeviceControls';
import { useZoneDeviceTelemetry } from '../../hooks/useZoneDeviceTelemetry';
import ZoneActuatorControlGrid from './ZoneActuatorControlGrid';
import ZoneBinaryStateGrid from './ZoneBinaryStateGrid';
import ZoneCommandAckPanel from './ZoneCommandAckPanel';
import ZoneSensorGrid from './ZoneSensorGrid';

const INPUT_KEYS = ['din_00', 'din_01', 'din_02', 'din_03'];

function formatTimestamp(value) {
  if (!value) return 'n/a';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'n/a';
  return date.toLocaleString();
}

export default function ZoneDeviceModal({
  isOpen,
  onClose,
  device,
  greenhouseId,
  onNotify,
}) {
  const telemetryScopeZoneIds = useMemo(() => {
    if (!device) {
      return [];
    }

    const metadataZoneId =
      typeof device.metadata?.zone_id === 'string' && device.metadata.zone_id.trim().length > 0
        ? device.metadata.zone_id.trim()
        : null;

    const candidates = [device.zone_id, device.device_id, metadataZoneId]
      .filter((value) => typeof value === 'string' && value.trim().length > 0)
      .map((value) => value.trim());

    return [...new Set(candidates)];
  }, [device]);

  const {
    metrics,
    loading,
    refreshing,
    error: telemetryError,
    refresh,
  } = useZoneDeviceTelemetry({
    greenhouseId,
    zoneIds: telemetryScopeZoneIds,
    enabled: isOpen && Boolean(device),
    pollMs: 5000,
  });

  const {
    pendingChannels,
    error: commandError,
    latestAck,
    optimisticOutputs,
    reconcileTelemetry,
    setChannelState,
  } = useZoneDeviceControls({
    greenhouseId,
    zoneId: device?.zone_id,
    deviceId: device?.device_id,
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    reconcileTelemetry(metrics);
  }, [isOpen, metrics, reconcileTelemetry]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const onEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !device) {
    return null;
  }

  const deviceIsLive = device.is_live !== false;

  const handleSetState = async (channel, state) => {
    if (!deviceIsLive) {
      if (onNotify) {
        onNotify('Device is offline. Output commands are disabled until heartbeat resumes.');
      }
      return;
    }

    try {
      await setChannelState(channel, state);
      if (onNotify) {
        onNotify(`Sent OUT_${String(channel).padStart(2, '0')} -> ${state ? 'HIGH' : 'LOW'} (waiting for ACK).`);
      }
      setTimeout(() => {
        void refresh();
      }, 250);
    } catch {
      if (onNotify) {
        onNotify(`Failed to send OUT_${String(channel).padStart(2, '0')} command.`);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 px-3 py-4 sm:py-6"
      onClick={onClose}
      role="presentation"
    >
      <article
        className="my-auto flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">Device Controls</h2>
            <p className="mt-1 font-mono text-xs text-muted">device_id: {device.device_id}</p>
            <p className="mt-1 text-xs text-muted">
              zone: {device.zone_name || 'unassigned'} ({device.zone_id || 'n/a'})
            </p>
            <p className="text-xs text-muted">last seen: {formatTimestamp(device.last_seen_at)}</p>
            <p className="text-xs text-muted">
              status: {deviceIsLive ? 'LIVE' : 'OFFLINE'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void refresh()}
              className="min-h-[36px] rounded border border-border px-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink transition hover:bg-surface2"
              style={{ fontFamily: "'Source Code Pro', monospace" }}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[36px] rounded border border-border px-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink transition hover:bg-surface2"
              style={{ fontFamily: "'Source Code Pro', monospace" }}
            >
              Close
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-8">
          {(telemetryError || commandError) && (
            <p className="mb-4 rounded border border-crit/30 bg-crit/10 px-3 py-2 text-sm text-crit">
              {telemetryError || commandError}
            </p>
          )}

          {!deviceIsLive && (
            <p className="mb-4 rounded border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn">
              Device appears offline. Commands are temporarily disabled until it announces again.
            </p>
          )}

          {latestAck && (
            <div className="mb-4">
              <ZoneCommandAckPanel ack={latestAck} />
            </div>
          )}

          {loading ? (
            <p className="text-sm text-muted">Loading live device data...</p>
          ) : (
            <div className="grid gap-5">
              <ZoneSensorGrid metrics={metrics} />
              <ZoneBinaryStateGrid title="IN_IO Status" keys={INPUT_KEYS} metrics={metrics} />
              <ZoneActuatorControlGrid
                metrics={metrics}
                optimisticOutputs={optimisticOutputs}
                pendingChannels={pendingChannels}
                disabled={!deviceIsLive}
                onSetState={handleSetState}
              />
            </div>
          )}
        </div>
      </article>
    </div>
  );
}

ZoneDeviceModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  device: PropTypes.shape({
    device_id: PropTypes.string,
    zone_id: PropTypes.string,
    zone_name: PropTypes.string,
    last_seen_at: PropTypes.string,
    is_live: PropTypes.bool,
    metadata: PropTypes.object,
  }),
  greenhouseId: PropTypes.string.isRequired,
  onNotify: PropTypes.func,
};

ZoneDeviceModal.defaultProps = {
  device: null,
  onNotify: undefined,
};
