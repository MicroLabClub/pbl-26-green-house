import { useState, useEffect } from 'react';
import { apiRequest } from '../services/apiClient';

const GRANULARITY_FOR_RANGE = {
  '24h': 'minute',
  '7d':  'hourly',
  '30d': 'daily',
};

function rangeToFrom(range) {
  const now = new Date();
  const from = new Date(now);
  if (range === '7d')       from.setDate(now.getDate() - 7);
  else if (range === '30d') from.setDate(now.getDate() - 30);
  else                      from.setHours(now.getHours() - 24);
  return { from: from.toISOString(), to: now.toISOString() };
}

export function useHistoricalData({ greenhouseId, sensorKey, zoneId, range = '24h', granularity }) {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  const resolvedGranularity = granularity ?? GRANULARITY_FOR_RANGE[range] ?? 'hourly';

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, [range]);

  useEffect(() => {
    if (!sensorKey || !greenhouseId) {
      setData([]);
      setMeta(null);
      setError(greenhouseId ? null : 'Select a greenhouse to view history.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const { from, to } = rangeToFrom(range);
    const params = new URLSearchParams({
      greenhouse_id: greenhouseId,
      sensor_key:    sensorKey,
      granularity:   resolvedGranularity,
      from,
      to,
    });
    if (zoneId) params.set('zone_id', zoneId);

    apiRequest(`/v1/dashboard/history?${params}`)
      .then(body => {
        setData(body.points ?? []);
        setMeta({ unit: body.unit ?? '', granularity: body.granularity });
      })
      .catch(err => {
        setError(err.message || 'Failed to load historical data.');
        setData([]);
      })
      .finally(() => setIsLoading(false));
  }, [greenhouseId, sensorKey, zoneId, range, resolvedGranularity, tick]);

  return { data, meta, isLoading, error };
}
