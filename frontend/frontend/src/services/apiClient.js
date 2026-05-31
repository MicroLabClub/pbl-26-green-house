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
    let message = `Request failed with status ${response.status}`;
    
    // Check if the parsed string looks like an HTML document
    const isHtml = typeof parsed === 'string' && (
      parsed.trim().toLowerCase().startsWith('<html') || 
      parsed.trim().toLowerCase().startsWith('<!doctype html')
    );

    if (isHtml) {
        if (response.status === 413) message = "File exceeds the maximum allowed size (50MB).";
        else if (response.status === 502) message = "Bad Gateway: The server is temporarily unreachable.";
        else if (response.status === 503) message = "Service Unavailable: The server is overloaded or down for maintenance.";
        else if (response.status === 504) message = "Gateway Timeout: The server took too long to respond.";
        else if (response.status >= 520 && response.status <= 530 || parsed.includes('Cloudflare')) {
            message = "Cloudflare Network Error: The backend service is currently unreachable or disconnected. Please try again later.";
        }
        else message = `An unexpected server error occurred (Status ${response.status}).`;
    } else {
        message =
            (parsed && typeof parsed === 'object' && 'message' in parsed && parsed.message) ||
            (parsed && typeof parsed === 'object' && 'error' in parsed && parsed.error) ||
            (typeof parsed === 'string' && parsed) ||
            message;
    }

    throw new ApiError(String(message), response.status, parsed);
  }

  return parsed;
}
