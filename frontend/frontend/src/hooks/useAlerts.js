import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../services/apiClient';

const SEVERITY_ORDER = { CRITICAL: 0, WARNING: 1 };
const ALERT_POLL_MS = 5000;

function sortAlerts(list) {
  return [...list].sort((a, b) => {
    if (a.acknowledged !== b.acknowledged) return a.acknowledged ? 1 : -1;
    return (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3);
  });
}

export function useAlerts({ enabled = true, greenhouseId = '' } = {}) {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let cancelled = false;

    const refresh = () => {
      apiRequest('/v1/alerts')
        .then(data => {
          if (cancelled) return;
          const all = Array.isArray(data) ? data : [];
          const filtered = greenhouseId ? all.filter(a => a.greenhouse_id === greenhouseId) : all;
          setAlerts(sortAlerts(filtered));
        })
        .catch(() => {});
    };

    refresh();
    const id = setInterval(refresh, ALERT_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [enabled, greenhouseId]);

  const acknowledge = useCallback((id) => {
    apiRequest(`/v1/alerts/${id}/acknowledge`, { method: 'POST' })
      .then(updated =>
        setAlerts(prev => sortAlerts(prev.map(a => a.id === id ? updated : a)))
      )
      .catch(() => {});
  }, []);

  const dismiss = useCallback((id) => {
    apiRequest(`/v1/alerts/${id}`, { method: 'DELETE' })
      .then(() => setAlerts(prev => prev.filter(a => a.id !== id)))
      .catch(() => {});
  }, []);

  return { alerts: enabled ? alerts : [], acknowledge, dismiss };
}
