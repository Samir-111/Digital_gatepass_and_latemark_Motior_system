export function getAuthToken() {
  return localStorage.getItem('gatepass_token');
}

export function getAuthUser() {
  const user = localStorage.getItem('gatepass_user');
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function getAuthRole() {
  return localStorage.getItem('gatepass_role');
}

export function removeAuthToken() {
  localStorage.removeItem('gatepass_token');
  localStorage.removeItem('gatepass_user');
  localStorage.removeItem('gatepass_role');
}

export function setAuthToken(token) {
  localStorage.setItem('gatepass_token', token);
}

export async function apiFetch(url, options = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Ensure content-type is json if passing a body and not already set
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = { error: text };
  }

  if (!response.ok) {
    throw new Error(data.error || response.statusText || 'Request failed');
  }

  return data;
}
