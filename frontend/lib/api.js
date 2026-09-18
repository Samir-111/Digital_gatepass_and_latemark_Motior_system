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
  try {
    sessionStorage.setItem('gatepass_token', token);
    sessionStorage.setItem('gatepass_role', role);

    // Prepare a safe user object to avoid exceeding sessionStorage quota (e.g., if photo is a multi-megabyte base64 image)
    let safeUser = user;
    if (user && typeof user === 'object') {
      // If photo is huge (> 500KB), strip or omit it from sessionStorage to prevent QuotaExceededError
      if (user.photo && typeof user.photo === 'string' && user.photo.length > 500000) {
        safeUser = { ...user, photo: '' };
      }
    }

    try {
      sessionStorage.setItem('gatepass_user', typeof safeUser === 'string' ? safeUser : JSON.stringify(safeUser));
    } catch (quotaErr) {
      console.warn('Storage quota exceeded when saving full user profile. Saving minimal profile.', quotaErr);
      // Strip heavy data fields and retry
      if (user && typeof user === 'object') {
        const minimalUser = {
          id: user.id || user._id,
          name: user.name,
          email: user.email,
          role: role || user.role,
          department: user.department,
          roll_no: user.roll_no,
          college_id: user.college_id,
          phone: user.phone,
          parent_phone: user.parent_phone,
          class_teacher_id: user.class_teacher_id,
          selected_hod_id: user.selected_hod_id
        };
        sessionStorage.setItem('gatepass_user', JSON.stringify(minimalUser));
      }
    }
  } catch (err) {
    console.error('Failed to set auth session in storage:', err);
  }

  // Clean legacy localStorage to prevent unauthorized persistent logins
  try {
    localStorage.removeItem('gatepass_token');
    localStorage.removeItem('gatepass_user');
    localStorage.removeItem('gatepass_role');
  } catch {
    // Ignore localStorage cleanup errors
  }
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
