import { useState, useEffect } from 'react';
import { apiRequest } from '../services/apiClient';

export function useSensorData({ enabled = true, greenhouseId = '', zoneId = '' } = {}) {
  const [readings, setReadings] = useState([]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const params = new URLSearchParams();
    if (greenhouseId) params.set('greenhouse_id', greenhouseId);
    if (zoneId) params.set('zone_id', zoneId);
    const suffix = params.toString() ? `?${params.toString()}` : '';

    let cancelled = false;

    const fetchReadings = () => {
      const controller = new AbortController();
      apiRequest(`/v1/dashboard/live${suffix}`, { signal: controller.signal })
        .then(data => {
          if (cancelled) return;
          if (!Array.isArray(data)) { setReadings([]); return; }
          setReadings(data.map(r => ({
            ...r,
            lastUpdatedAt: r.lastUpdatedAt ?? new Date().toISOString(),
          })));
        })
        .catch(() => {});
      return controller;
    };

    let activeController = fetchReadings();
    const id = setInterval(() => {
      activeController?.abort();
      activeController = fetchReadings();
    }, 10000);

    return () => {
      cancelled = true;
      activeController?.abort();
      clearInterval(id);
    };
  }, [enabled, greenhouseId, zoneId]);

  return enabled ? readings : [];
}
