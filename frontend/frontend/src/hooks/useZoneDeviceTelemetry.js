import { useCallback, useEffect, useMemo, useState } from 'react';
import { getZoneLiveReadings } from '../services/zonesApi';

function toMetrics(readings) {
  const metrics = {};
  for (const reading of readings) {
    if (!reading || typeof reading.sensor_key !== 'string') {
      continue;
    }

    const value = Number(reading.value);
    if (Number.isFinite(value)) {
      metrics[reading.sensor_key] = value;
    }
  }
  return metrics;
}

function normalizeZoneScopes(zoneIds, zoneId) {
  const raw = Array.isArray(zoneIds) ? zoneIds : [zoneId];
  const cleaned = raw
    .filter((value) => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim());

  return [...new Set(cleaned)];
}

export function useZoneDeviceTelemetry({ greenhouseId, zoneId, zoneIds, enabled = true, pollMs = 3000 }) {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const zoneScopes = useMemo(
    () => normalizeZoneScopes(zoneIds, zoneId),
    // Serialize to a string so inline array props don't cause reference churn
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [zoneId, Array.isArray(zoneIds) ? zoneIds.join('\x00') : '']
  );

  const refresh = useCallback(async () => {
    if (!greenhouseId || zoneScopes.length === 0) {
      setReadings([]);
      setLoading(false);
      setRefreshing(false);
      setError('');
      return;
    }

    setRefreshing(true);
    try {
      let selectedReadings = [];

      for (const scopeZoneId of zoneScopes) {
        const nextReadings = await getZoneLiveReadings({ greenhouseId, zoneId: scopeZoneId });
        if (Array.isArray(nextReadings) && nextReadings.length > 0) {
          selectedReadings = nextReadings;
          break;
        }
      }

      setReadings(selectedReadings);
      setError('');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [greenhouseId, zoneScopes]);

  useEffect(() => {
    if (!enabled) {
      setReadings([]);
      setLoading(false);
      setRefreshing(false);
      setError('');
      return undefined;
    }

    void refresh();

    const id = setInterval(() => {
      void refresh();
    }, pollMs);

    return () => clearInterval(id);
  }, [enabled, pollMs, refresh]);

  const metrics = useMemo(() => toMetrics(readings), [readings]);

  return {
    readings,
    metrics,
    loading,
    refreshing,
    error,
    refresh,
  };
}
