import { apiRequest } from './apiClient';
import { API_BASE_URL } from '../config/runtimeConfig';

export async function listGreenhouses() {
  return apiRequest('/v1/g', { method: 'GET' });
}

export async function getGreenhouse({ greenhouseId }) {
  return apiRequest(`/v1/g/${encodeURIComponent(greenhouseId)}`, { method: 'GET' });
}

export async function createGreenhouse({ name, greenhouseId, gatewayId, latitude, longitude, description }) {
  return apiRequest('/v1/g', {
    method: 'POST',
    body: {
      name,
      greenhouse_id: greenhouseId,
      gateway_id: gatewayId,
      latitude,
      longitude,
      description,
    },
  });
}

export async function updateGreenhouse({ greenhouseId, name, gatewayId, latitude, longitude, description }) {
  return apiRequest(`/v1/g/${encodeURIComponent(greenhouseId)}`, {
    method: 'PATCH',
    body: {
      name,
      gateway_id: gatewayId,
      latitude,
      longitude,
      description,
    },
  });
}

export async function uploadGreenhousePhoto({ greenhouseId, file }) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE_URL}/v1/g/${encodeURIComponent(greenhouseId)}/photo`, {
    method: 'POST',
    body: form,
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Photo upload failed: ${res.status}`);
  return res.json();
}

export async function deleteGreenhouse({ greenhouseId }) {
  return apiRequest(`/v1/g/${encodeURIComponent(greenhouseId)}`, {
    method: 'DELETE',
  });
}

export async function getGreenhouseGatewayConfig({ greenhouseId }) {
  return apiRequest(`/v1/g/${encodeURIComponent(greenhouseId)}/gateway-config`, {
    method: 'GET',
  });
}
