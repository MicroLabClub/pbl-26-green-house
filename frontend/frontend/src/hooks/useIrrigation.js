import { useState, useEffect, useCallback, useRef } from 'react';
import { getZoneRegistry, sendZoneCommand, getZoneLiveReadings } from '../services/zonesApi';

const IRRIGATION_CHANNEL = 'DOUT_00';
const LIVENESS_MS = 60_000;

function isLive(lastSeenAt) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < LIVENESS_MS;
}

function buildZones(assigned, readings) {
  return assigned.map(z => {
    const live = isLive(z.last_seen_at);
    const relayKey = IRRIGATION_CHANNEL.toLowerCase().replace('_', '_');
    const relayReading = readings.find(
      r => r.zone_id === z.zone_id && r.sensor_key === relayKey
    );
    const relayOn = relayReading ? relayReading.value === 1 : false;

    return {
      id:          z.device_id,
      zoneId:      z.zone_id,
      label:       z.zone_name || z.device_id,
      deviceId:    z.device_id,
      status:      !live ? 'OFFLINE' : relayOn ? 'ACTIVE' : 'IDLE',
      lastSeenAt:  z.last_seen_at,
      countdown:   null,
    };
  });
}

export function useIrrigation(greenhouseId) {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const timers = useRef({});

  useEffect(() => {
    if (!greenhouseId) {
      setZones([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all([
      getZoneRegistry({ greenhouseId }),
      getZoneLiveReadings({ greenhouseId }).catch(() => []),
    ])
      .then(([registry, readings]) => {
        if (cancelled) return;
        const assigned = registry.assigned ?? [];
        setZones(buildZones(assigned, readings));
      })
      .catch(() => {
        if (cancelled) return;
        setZones([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      Object.values(timers.current).forEach(clearInterval);
    };
  }, [greenhouseId]);

  const toggleZone = useCallback((deviceId, active) => {
    if (!greenhouseId) return;

    if (timers.current[deviceId]) {
      clearInterval(timers.current[deviceId]);
      delete timers.current[deviceId];
    }

    setZones(prev => prev.map(z =>
      z.id === deviceId
        ? { ...z, status: active ? 'ACTIVE' : 'IDLE', countdown: null }
        : z
    ));

    const zone = zones.find(z => z.id === deviceId);
    if (!zone) return;

    sendZoneCommand({
      greenhouseId,
      action:   'SET_OUTPUT',
      zoneId:   zone.zoneId,
      deviceId: zone.deviceId,
      payload:  { channel: IRRIGATION_CHANNEL, state: active ? 'HIGH' : 'LOW' },
    }).catch(() => {
      setZones(prev => prev.map(z =>
        z.id === deviceId ? { ...z, status: 'IDLE' } : z
      ));
    });
  }, [greenhouseId, zones]);

  const manualOverride = useCallback((deviceId) => {
    if (!greenhouseId) return;

    if (timers.current[deviceId]) clearInterval(timers.current[deviceId]);

    let remaining = 30;
    setZones(prev => prev.map(z =>
      z.id === deviceId ? { ...z, status: 'ACTIVE', countdown: remaining } : z
    ));

    const zone = zones.find(z => z.id === deviceId);
    if (zone) {
      sendZoneCommand({
        greenhouseId,
        action:   'SET_OUTPUT',
        zoneId:   zone.zoneId,
        deviceId: zone.deviceId,
        payload:  { channel: IRRIGATION_CHANNEL, state: 'HIGH' },
      }).catch(() => {});
    }

    timers.current[deviceId] = setInterval(() => {
      remaining -= 1;
      setZones(prev => prev.map(z =>
        z.id === deviceId ? { ...z, countdown: remaining } : z
      ));

      if (remaining <= 0) {
        clearInterval(timers.current[deviceId]);
        delete timers.current[deviceId];
        setZones(prev => prev.map(z =>
          z.id === deviceId ? { ...z, status: 'IDLE', countdown: null } : z
        ));
        const z = zones.find(z => z.id === deviceId);
        if (z) {
          sendZoneCommand({
            greenhouseId,
            action:   'SET_OUTPUT',
            zoneId:   z.zoneId,
            deviceId: z.deviceId,
            payload:  { channel: IRRIGATION_CHANNEL, state: 'LOW' },
          }).catch(() => {});
        }
      }
    }, 1000);
  }, [greenhouseId, zones]);

  const emergencyStop = useCallback(() => {
    Object.values(timers.current).forEach(clearInterval);
    timers.current = {};

    const activeZones = zones.filter(z => z.status === 'ACTIVE');
    setZones(prev => prev.map(z => ({ ...z, status: z.status === 'OFFLINE' ? 'OFFLINE' : 'IDLE', countdown: null })));

    activeZones.forEach(z => {
      sendZoneCommand({
        greenhouseId,
        action:   'SET_OUTPUT',
        zoneId:   z.zoneId,
        deviceId: z.deviceId,
        payload:  { channel: IRRIGATION_CHANNEL, state: 'LOW' },
      }).catch(() => {});
    });
  }, [greenhouseId, zones]);

  return { zones, loading, toggleZone, manualOverride, emergencyStop };
}
