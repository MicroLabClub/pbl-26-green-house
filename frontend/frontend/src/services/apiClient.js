import { API_BASE_URL } from '../config/runtimeConfig';

export class ApiError extends Error {
  constructor(message, status, body = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

async function parseResponseBody(response) {
  const contentType = response.headers.get('content-type') ?? '';
  if (response.status === 204) {
    return null;
  }

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
}

export async function apiRequest(path, options = {}) {
  const { body, headers, ...rest } = options;

  let response;
  try {
    response = await fetch(buildUrl(path), {
      headers: {
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(headers ?? {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'include',
      ...rest,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new ApiError(`Unable to reach backend API (${API_BASE_URL}). ${reason}`, 0);
  }

  const parsed = await parseResponseBody(response);

  if (!response.ok) {
    const message =
      (parsed && typeof parsed === 'object' && 'message' in parsed && parsed.message) ||
      (parsed && typeof parsed === 'object' && 'error' in parsed && parsed.error) ||
      (typeof parsed === 'string' && parsed) ||
      `Request failed with status ${response.status}`;

    throw new ApiError(String(message), response.status, parsed);
  }

  return parsed;
}
