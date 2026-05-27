import { apiRequest } from './apiClient';

export async function signupTenantAdmin({ username, password, tenantName, tenantId }) {
  return apiRequest('/v1/auth/signup', {
    method: 'POST',
    body: {
      username,
      password,
      tenant_name: tenantName,
      tenant_id: tenantId,
    },
  });
}

export async function login({ username, password }) {
  return apiRequest('/v1/auth/login', {
    method: 'POST',
    body: {
      username,
      password,
    },
  });
}

export async function logout() {
  return apiRequest('/v1/auth/logout', { method: 'POST' });
}

export async function getMe() {
  return apiRequest('/v1/auth/me', { method: 'GET' });
}
