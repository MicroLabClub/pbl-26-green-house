import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ApiError, apiRequest } from '../services/apiClient';

const STATUS_POLL_INTERVAL_MS = 500;
const STATUS_POLL_TIMEOUT_MS = 12000;

function thresholdsPath(greenhouseId, zoneId) {
  return `/v1/g/${encodeURIComponent(greenhouseId)}/zones/${encodeURIComponent(zoneId)}/thresholds`;
}

function statusPath(greenhouseId, zoneId) {
  return `${thresholdsPath(greenhouseId, zoneId)}/status`;
}

async function fetchThresholdConfig(greenhouseId, zoneId) {
  return apiRequest(thresholdsPath(greenhouseId, zoneId), { method: 'GET' });
}

async function fetchThresholdStatus(greenhouseId, zoneId) {
  return apiRequest(statusPath(greenhouseId, zoneId), { method: 'GET' });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toNumberOrNull(val) {
  if (val === '' || val == null) return null;
  return Number(val);
}

function coerceNumbers(thresholds) {
  const out = {};
  for (const [sensor, levels] of Object.entries(thresholds)) {
    out[sensor] = {};
    for (const [level, bounds] of Object.entries(levels ?? {})) {
      out[sensor][level] = {};
      for (const [bound, val] of Object.entries(bounds ?? {})) {
        out[sensor][level][bound] = toNumberOrNull(val);
      }
    }
  }
  return out;
}

async function persistThresholds(greenhouseId, zoneId, data) {
  return apiRequest(thresholdsPath(greenhouseId, zoneId), {
    method: 'PUT',
    body: { thresholds: coerceNumbers(data) },
  });
}

function finiteOrNull(val) {
  if (val === '' || val == null) return null;
  const num = Number(val);
  return Number.isFinite(num) ? num : NaN;
}

export function validateThresholds(thresholds) {
  const errors = [];
  for (const [sensor, levels] of Object.entries(thresholds ?? {})) {
    const normalized = {};
    for (const level of ['normal', 'warn', 'critical']) {
      const bounds = levels?.[level] ?? {};
      const min = finiteOrNull(bounds.min);
      const max = finiteOrNull(bounds.max);
      normalized[level] = { min, max };

      if (Number.isNaN(min)) errors.push(`${sensor}.${level}.min must be numeric`);
      if (Number.isNaN(max)) errors.push(`${sensor}.${level}.max must be numeric`);
      if (Number.isFinite(min) && Number.isFinite(max) && min > max) {
        errors.push(`${sensor}.${level}.min must be <= max`);
      }
    }

    const { normal, warn, critical } = normalized;
    if (Number.isFinite(warn.min) && Number.isFinite(normal.min) && warn.min > normal.min) {
      errors.push(`${sensor}.warn.min must be <= normal.min`);
    }
    if (Number.isFinite(warn.max) && Number.isFinite(normal.max) && warn.max < normal.max) {
      errors.push(`${sensor}.warn.max must be >= normal.max`);
    }
    if (Number.isFinite(critical.min) && Number.isFinite(warn.min) && critical.min > warn.min) {
      errors.push(`${sensor}.critical.min must be <= warn.min`);
    }
    if (Number.isFinite(critical.max) && Number.isFinite(warn.max) && critical.max < warn.max) {
      errors.push(`${sensor}.critical.max must be >= warn.max`);
    }
  }
  return errors;
}

export function useZoneThresholds({ greenhouseId, zoneId }) {
  const [thresholds, setThresholds] = useState({});
  const [applyStatus, setApplyStatus] = useState(null);
  const [configVersion, setConfigVersion] = useState(0);
  const [commandId, setCommandId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const mountedRef = useRef(true);
  const latestCommandIdRef = useRef(null);

  const validationErrors = useMemo(() => validateThresholds(thresholds), [thresholds]);

  const applyConfig = useCallback((data) => {
    setThresholds(data?.thresholds ?? {});
    setApplyStatus(data?.apply_status ?? null);
    setConfigVersion(data?.config_version ?? 0);
    setCommandId(data?.command_id ?? null);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!greenhouseId || !zoneId) return;
    setThresholds({});
    setApplyStatus(null);
    setConfigVersion(0);
    setCommandId(null);
    latestCommandIdRef.current = null;
    setDirty(false);
    setError('');
    setLoading(true);
    fetchThresholdConfig(greenhouseId, zoneId)
      .then(applyConfig)
      .catch((nextError) => {
        setThresholds({});
        setError(nextError instanceof Error ? nextError.message : String(nextError));
      })
      .finally(() => setLoading(false));
  }, [applyConfig, greenhouseId, zoneId]);

  const pollStatus = useCallback(async (expectedCommandId) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < STATUS_POLL_TIMEOUT_MS) {
      if (!mountedRef.current || latestCommandIdRef.current !== expectedCommandId) return;
      await wait(STATUS_POLL_INTERVAL_MS);
      try {
        const status = await fetchThresholdStatus(greenhouseId, zoneId);
        if (!mountedRef.current || latestCommandIdRef.current !== expectedCommandId) return;
        setApplyStatus(status);
        if (status?.command_id === expectedCommandId && String(status?.status || '').toUpperCase() !== 'PENDING') {
          return;
        }
      } catch (nextError) {
        if (nextError instanceof ApiError && nextError.status === 404) continue;
        if (!mountedRef.current || latestCommandIdRef.current !== expectedCommandId) return;
        setApplyStatus({
          command_id: expectedCommandId,
          status: 'ERROR',
          reason: nextError instanceof Error ? nextError.message : String(nextError),
          updated_at: new Date().toISOString(),
        });
        return;
      }
    }

    if (!mountedRef.current || latestCommandIdRef.current !== expectedCommandId) return;
    setApplyStatus((current) => ({
      ...(current ?? {}),
      command_id: expectedCommandId,
      status: 'TIMEOUT',
      reason: 'No gateway threshold ACK observed yet.',
      updated_at: new Date().toISOString(),
    }));
  }, [greenhouseId, zoneId]);

  const updateField = useCallback((sensorKey, level, bound, value) => {
    setThresholds((prev) => ({
      ...prev,
      [sensorKey]: {
        ...prev[sensorKey],
        [level]: { ...prev[sensorKey]?.[level], [bound]: value },
      },
    }));
    setDirty(true);
    setError('');
  }, []);

  const save = useCallback(async () => {
    if (!greenhouseId || !zoneId) return;
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = await persistThresholds(greenhouseId, zoneId, thresholds);
      applyConfig(saved);
      setDirty(false);
      if (saved?.command_id) {
        latestCommandIdRef.current = saved.command_id;
        void pollStatus(saved.command_id);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setSaving(false);
    }
  }, [applyConfig, greenhouseId, pollStatus, thresholds, validationErrors, zoneId]);

  const reset = useCallback(() => {
    if (!greenhouseId || !zoneId) return;
    fetchThresholdConfig(greenhouseId, zoneId)
      .then((data) => { applyConfig(data); setDirty(false); setError(''); })
      .catch((nextError) => setError(nextError instanceof Error ? nextError.message : String(nextError)));
  }, [applyConfig, greenhouseId, zoneId]);

  return {
    thresholds,
    updateField,
    save,
    saving,
    dirty,
    reset,
    loading,
    validationErrors,
    applyStatus,
    configVersion,
    commandId,
    error,
  };
}
