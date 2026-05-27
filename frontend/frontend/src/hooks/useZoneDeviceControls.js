import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../services/apiClient';
import { getZoneCommandAck, sendZoneCommand } from '../services/zonesApi';

const ACK_POLL_INTERVAL_MS = 400;
const ACK_POLL_TIMEOUT_MS = 12000;

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function useZoneDeviceControls({ greenhouseId, zoneId, deviceId }) {
  const [pendingChannels, setPendingChannels] = useState({});
  const [error, setError] = useState('');
  const [latestAck, setLatestAck] = useState(null);
  const [optimisticOutputs, setOptimisticOutputs] = useState({});
  const mountedRef = useRef(true);
  const latestCommandIdRef = useRef(null);
  const commandChannelByIdRef = useRef({});

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setLatestAck(null);
    latestCommandIdRef.current = null;
    setError('');
    setOptimisticOutputs({});
    commandChannelByIdRef.current = {};
  }, [greenhouseId, zoneId, deviceId]);

  const clearOptimisticForCommand = useCallback((commandId) => {
    const metricKey = commandChannelByIdRef.current[commandId];
    if (!metricKey) {
      return;
    }

    setOptimisticOutputs((current) => {
      if (!Object.prototype.hasOwnProperty.call(current, metricKey)) {
        return current;
      }

      const next = { ...current };
      delete next[metricKey];
      return next;
    });

    delete commandChannelByIdRef.current[commandId];
  }, []);

  const reconcileTelemetry = useCallback((metrics) => {
    if (!metrics || typeof metrics !== 'object') {
      return;
    }

    setOptimisticOutputs((current) => {
      const next = { ...current };
      let changed = false;

      for (const [metricKey, optimisticState] of Object.entries(current)) {
        const telemetryValue = metrics[metricKey];
        if (telemetryValue === undefined || telemetryValue === null) {
          continue;
        }

        const telemetryState = Number(telemetryValue) >= 0.5 ? 1 : 0;
        if (telemetryState === optimisticState) {
          delete next[metricKey];
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, []);

  const pollCommandAck = useCallback(async (commandId, fallbackDeviceId, fallbackZoneId) => {
    const start = Date.now();

    while (Date.now() - start < ACK_POLL_TIMEOUT_MS) {
      if (!mountedRef.current || latestCommandIdRef.current !== commandId) {
        return;
      }

      await wait(ACK_POLL_INTERVAL_MS);

      try {
        const ack = await getZoneCommandAck({ greenhouseId, commandId });
        if (!mountedRef.current || latestCommandIdRef.current !== commandId) {
          return;
        }

        setLatestAck({
          command_id: ack?.command_id || commandId,
          status: String(ack?.status || 'UNKNOWN').toUpperCase(),
          reason: typeof ack?.reason === 'string' ? ack.reason : '',
          timestamp: ack?.timestamp || new Date().toISOString(),
          device_id: ack?.device_id || fallbackDeviceId || null,
          zone_id: ack?.zone_id || fallbackZoneId || null,
          pending: false,
        });

        const ackStatus = String(ack?.status || 'UNKNOWN').toUpperCase();
        if (ackStatus === 'FAILED') {
          clearOptimisticForCommand(commandId);
        }
        return;
      } catch (nextError) {
        if (nextError instanceof ApiError && nextError.status === 404) {
          continue;
        }

        if (!mountedRef.current || latestCommandIdRef.current !== commandId) {
          return;
        }

        setLatestAck({
          command_id: commandId,
          status: 'ERROR',
          reason: nextError instanceof Error ? nextError.message : String(nextError),
          timestamp: new Date().toISOString(),
          device_id: fallbackDeviceId || null,
          zone_id: fallbackZoneId || null,
          pending: false,
        });
        clearOptimisticForCommand(commandId);
        return;
      }
    }

    if (!mountedRef.current || latestCommandIdRef.current !== commandId) {
      return;
    }

    setLatestAck({
      command_id: commandId,
      status: 'TIMEOUT',
      reason: 'No gateway ACK observed yet.',
      timestamp: new Date().toISOString(),
      device_id: fallbackDeviceId || null,
      zone_id: fallbackZoneId || null,
      pending: false,
    });
    clearOptimisticForCommand(commandId);
  }, [clearOptimisticForCommand, greenhouseId]);

  const setChannelState = useCallback(async (channel, state) => {
    if (!deviceId) {
      throw new Error('Device id is required for output command.');
    }

    const channelKey = String(channel);
    const metricKey = `dout_${String(channel).padStart(2, '0')}`;
    const normalizedState = Number(state) >= 0.5 ? 1 : 0;

    setOptimisticOutputs((current) => ({
      ...current,
      [metricKey]: normalizedState,
    }));

    setPendingChannels((current) => ({ ...current, [channelKey]: true }));

    try {
      const response = await sendZoneCommand({
        greenhouseId,
        zoneId,
        deviceId,
        action: 'SET_OUTPUT',
        payload: {
          channel,
          state: normalizedState,
        },
      });

      if (response?.command_id) {
        commandChannelByIdRef.current[response.command_id] = metricKey;
        latestCommandIdRef.current = response.command_id;
        setLatestAck({
          command_id: response.command_id,
          status: 'PENDING',
          reason: 'Waiting for gateway ACK...',
          timestamp: new Date().toISOString(),
          device_id: response?.device_id || deviceId,
          zone_id: zoneId || null,
          pending: true,
        });

        void pollCommandAck(response.command_id, response?.device_id || deviceId, zoneId || null);
      }

      setError('');
      return response;
    } catch (nextError) {
      setOptimisticOutputs((current) => {
        const next = { ...current };
        delete next[metricKey];
        return next;
      });
      setError(nextError instanceof Error ? nextError.message : String(nextError));
      throw nextError;
    } finally {
      setPendingChannels((current) => {
        const next = { ...current };
        delete next[channelKey];
        return next;
      });
    }
  }, [deviceId, greenhouseId, pollCommandAck, zoneId]);

  return {
    pendingChannels,
    error,
    latestAck,
    optimisticOutputs,
    reconcileTelemetry,
    setChannelState,
  };
}
