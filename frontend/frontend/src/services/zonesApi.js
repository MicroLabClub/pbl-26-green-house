import { apiRequest } from './apiClient';

function greenhouseBasePath(greenhouseId) {
  const normalized = String(greenhouseId ?? '').trim();
  if (!normalized) {
    throw new Error('greenhouseId is required');
  }
  return `/v1/g/${encodeURIComponent(normalized)}/zones`;
}

export async function getZoneRegistry({ greenhouseId }) {
  return apiRequest(`${greenhouseBasePath(greenhouseId)}/registry`, { method: 'GET' });
}

export async function assignZone({ greenhouseId, deviceId, zoneId, zoneName, metadata }) {
  return apiRequest(`${greenhouseBasePath(greenhouseId)}/assign`, {
    method: 'POST',
    body: {
      device_id: deviceId,
      zone_id: zoneId,
      zone_name: zoneName,
      metadata,
    },
  });
}

export async function unassignZone({ greenhouseId, deviceId }) {
  return apiRequest(`${greenhouseBasePath(greenhouseId)}/unassign`, {
    method: 'POST',
    body: {
      device_id: deviceId,
    },
  });
}

export async function syncZoneRegistry({ greenhouseId, gatewayId }) {
  return apiRequest(`${greenhouseBasePath(greenhouseId)}/sync`, {
    method: 'POST',
    body: gatewayId ? { gateway_id: gatewayId } : {},
  });
}

export async function sendZoneCommand({
  greenhouseId,
  action,
  zoneId,
  deviceId,
  payload,
}) {
  return apiRequest(`${greenhouseBasePath(greenhouseId)}/command`, {
    method: 'POST',
    body: {
      action,
      zone_id: zoneId,
      device_id: deviceId,
      payload,
    },
  });
}

export async function getZoneCommandAck({ greenhouseId, commandId }) {
  if (!commandId) {
    throw new Error('commandId is required to query command ACK');
  }
  const params = new URLSearchParams({ command_id: commandId });
  return apiRequest(`${greenhouseBasePath(greenhouseId)}/command-ack?${params.toString()}`, { method: 'GET' });
}

export async function getZoneLiveReadings({ greenhouseId, zoneId }) {
  const params = new URLSearchParams();
  if (greenhouseId) {
    params.set('greenhouse_id', greenhouseId);
  }
  if (zoneId) {
    params.set('zone_id', zoneId);
  }

  const suffix = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`/v1/dashboard/live${suffix}`, { method: 'GET' });
}
