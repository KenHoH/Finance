const DEFAULT_API_URL = 'http://localhost:3000';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function getCookie(name) {
  return document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split('=')[1];
}

export function apiUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export async function apiRequest(path, options = {}) {
  const method = options.method || 'GET';
  const headers = {
    Accept: 'application/json',
    ...options.headers,
  };

  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
    const csrfToken = getCookie('csrf-token');
    if (csrfToken) headers['X-CSRF-Token'] = decodeURIComponent(csrfToken);
  }

  const response = await fetch(apiUrl(path), {
    ...options,
    method,
    headers,
    credentials: 'include',
    body: options.body instanceof FormData ? options.body : options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof data === 'object' && data?.message ? data.message : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, data);
  }

  return data;
}

export async function getCurrentUser() {
  const data = await apiRequest('/auth/me');
  return data.user || null;
}

export function startGoogleLogin(returnTo = '/dashboard') {
  window.location.href = apiUrl(`/auth/google?returnTo=${encodeURIComponent(returnTo)}`);
}

export async function logout() {
  try {
    return await apiRequest('/auth/logout', { method: 'POST' });
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      document.cookie = 'csrf-token=; Max-Age=0; path=/';
      return { message: 'logout cleared locally' };
    }
    throw error;
  }
}
