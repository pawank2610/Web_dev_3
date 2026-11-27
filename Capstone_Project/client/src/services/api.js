const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.port === '5173' ? 'http://localhost:5000/api' : '/api');

export const getStoredTokens = () => {
  return {
    accessToken: localStorage.getItem('shortlink_access_token'),
    refreshToken: localStorage.getItem('shortlink_refresh_token'),
  };
};

export const setStoredTokens = (accessToken, refreshToken) => {
  if (accessToken) localStorage.setItem('shortlink_access_token', accessToken);
  if (refreshToken) localStorage.setItem('shortlink_refresh_token', refreshToken);
};

export const clearStoredTokens = () => {
  localStorage.removeItem('shortlink_access_token');
  localStorage.removeItem('shortlink_refresh_token');
  localStorage.removeItem('shortlink_user');
};

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (newAccessToken) => {
  refreshSubscribers.forEach((cb) => cb(newAccessToken));
  refreshSubscribers = [];
};

export const fetchWithAuth = async (endpoint, options = {}) => {
  const { accessToken, refreshToken } = getStoredTokens();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && refreshToken && !endpoint.includes('/auth/')) {
    if (!isRefreshing) {
      isRefreshing = true;

      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        const refreshData = await refreshRes.json();

        if (refreshRes.ok && refreshData.accessToken) {
          setStoredTokens(refreshData.accessToken, null);
          onRefreshed(refreshData.accessToken);
        } else {
          clearStoredTokens();
          window.location.href = '/login';
          return Promise.reject(new Error('Session expired, please login again'));
        }
      } catch (err) {
        clearStoredTokens();
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    const retryPromise = new Promise((resolve) => {
      subscribeTokenRefresh((newAccessToken) => {
        headers['Authorization'] = `Bearer ${newAccessToken}`;
        resolve(
          fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
          })
        );
      });
    });

    res = await retryPromise;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.message || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const api = {
  register: (payload) =>
    fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(async (r) => {
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Registration failed');
      return d;
    }),

  login: (payload) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(async (r) => {
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Login failed');
      return d;
    }),

  demoLogin: (role = 'user') =>
    fetch(`${API_BASE}/auth/demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    }).then(async (r) => {
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Demo login failed');
      return d;
    }),

  googleLogin: (payload = {}) =>
    fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(async (r) => {
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Google sign-in failed');
      return d;
    }),

  publicShorten: (payload) =>
    fetch(`${API_BASE}/links/public-shorten`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(async (r) => {
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Public shorten failed');
      return d;
    }),

  logout: () => fetchWithAuth('/auth/logout', { method: 'POST' }),
  getProfile: () => fetchWithAuth('/auth/me'),

  createLink: (payload) => fetchWithAuth('/links', { method: 'POST', body: JSON.stringify(payload) }),
  getUserLinks: (search = '') => fetchWithAuth(`/links${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getLinkById: (id) => fetchWithAuth(`/links/${id}`),
  deleteLink: (id) => fetchWithAuth(`/links/${id}`, { method: 'DELETE' }),

  getLinkAnalytics: (id) => fetchWithAuth(`/links/${id}/analytics`),

  getAdminLinks: ({ search = '', status = '', page = 1, limit = 20 } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    return fetchWithAuth(`/admin/links?${params.toString()}`);
  },
  updateLinkStatus: (id, payload) =>
    fetchWithAuth(`/admin/links/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) }),
  getAdminUsers: () => fetchWithAuth('/admin/users'),
  getAdminStats: () => fetchWithAuth('/admin/stats'),
};
