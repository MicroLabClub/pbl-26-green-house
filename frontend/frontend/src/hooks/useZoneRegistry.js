import { useCallback, useEffect, useState } from 'react';
import {
  assignZone,
  getZoneRegistry,
  syncZoneRegistry,
  unassignZone,
} from '../services/zonesApi';

export function useZoneRegistry({
  greenhouseId,
} = {}) {
  const [registry, setRegistry] = useState({
    tenant_id: null,
    greenhouse_id: greenhouseId,
    assigned_zones: [],
    discovered_devices: [],
  });
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!greenhouseId) {
      setRegistry((prev) => ({
        ...prev,
        greenhouse_id: greenhouseId ?? null,
        assigned_zones: [],
        discovered_devices: [],
      }));
      setLoading(false);
      return false;
    }

    try {
      const data = await getZoneRegistry({ greenhouseId });
      setRegistry(data);
      setError('');
      return true;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
      return false;
    } finally {
      setLoading(false);
    }
  }, [greenhouseId]);

  useEffect(() => {
    let cancelled = false;
    let timeoutId;
    let failureStreak = 0;

    const nextDelay = () => {
      if (failureStreak <= 0) return 5000;
      if (failureStreak === 1) return 8000;
      if (failureStreak === 2) return 13000;
      return 20000;
    };

    const tick = async () => {
      const ok = await refresh();
      failureStreak = ok ? 0 : failureStreak + 1;

      if (cancelled) {
        return;
      }

      timeoutId = setTimeout(() => {
        void tick();
      }, nextDelay());
    };

    void tick();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [refresh]);

  const runMutation = useCallback(async (action) => {
    setPending(true);
    try {
      const result = await action();
      setError('');
      await refresh();
      return result;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
      throw nextError;
    } finally {
      setPending(false);
    }
  }, [refresh]);

  const assign = useCallback(async ({ deviceId, zoneName, zoneId, metadata }) => {
    return runMutation(() => assignZone({
      greenhouseId,
      deviceId,
      zoneName,
      zoneId,
      metadata,
    }));
  }, [greenhouseId, runMutation]);

  const unassign = useCallback(async (deviceId) => {
    return runMutation(() => unassignZone({
      greenhouseId,
      deviceId,
    }));
  }, [greenhouseId, runMutation]);

  const rename = useCallback(async ({ deviceId, zoneId, zoneName, metadata }) => {
    return assign({
      deviceId,
      zoneId,
      zoneName,
      metadata,
    });
  }, [assign]);

  const sync = useCallback(async () => {
    return runMutation(() => syncZoneRegistry({
      greenhouseId,
    }));
  }, [greenhouseId, runMutation]);

  return {
    registry,
    loading,
    pending,
    error,
    refresh,
    assign,
    unassign,
    rename,
    sync,
  };
}
