export function getAuthToken() {
  return sessionStorage.getItem('gatepass_token');
}

export function getAuthUser() {
  const user = sessionStorage.getItem('gatepass_user');
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function getAuthRole() {
  return sessionStorage.getItem('gatepass_role');
}

export function removeAuthToken() {
  sessionStorage.removeItem('gatepass_token');
  sessionStorage.removeItem('gatepass_user');
  sessionStorage.removeItem('gatepass_role');
  localStorage.removeItem('gatepass_token');
  localStorage.removeItem('gatepass_user');
  localStorage.removeItem('gatepass_role');
}

export function setAuthToken(token) {
  sessionStorage.setItem('gatepass_token', token);
}

export function setAuthSession(token, user, role) {
  sessionStorage.setItem('gatepass_token', token);
  sessionStorage.setItem('gatepass_user', typeof user === 'string' ? user : JSON.stringify(user));
  sessionStorage.setItem('gatepass_role', role);
  // Clean legacy localStorage to prevent unauthorized persistent logins
  localStorage.removeItem('gatepass_token');
  localStorage.removeItem('gatepass_user');
  localStorage.removeItem('gatepass_role');
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
