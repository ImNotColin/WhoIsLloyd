// api.js — the single radio channel between the frontend and the server.
// One axios instance, token handling in the interceptors, and every endpoint
// wrapped in a one-liner so components never touch a URL string directly.

import axios from 'axios';

// ---- Token storage ----------------------------------------------------------
// JWTs live in localStorage under one key. The try/catch covers the day
// someone hand-edits the value in devtools and JSON.parse files a complaint.

const TOKEN_KEY = 'dbc_tokens';

export function getStoredTokens() {
  try {
    return JSON.parse(localStorage.getItem(TOKEN_KEY)) || null;
  } catch {
    return null;
  }
}

export function storeTokens(tokens) {
  if (tokens) localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  else localStorage.removeItem(TOKEN_KEY);
}

// ---- Axios instance & interceptors ------------------------------------------

const api = axios.create({ baseURL: '/api' });

// Outbound: clip the access token onto every request that has one.
api.interceptors.request.use((config) => {
  const tokens = getStoredTokens();
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

// Inbound: on a 401 we refresh the token silently, exactly once, then replay
// the original request. The user never knows. That's the point. The shared
// `refreshing` promise means ten requests failing at once produce one refresh
// call, not ten — and `_retried` keeps any single request from looping. Auth
// endpoints are exempt; a 401 from /auth/login is not a token problem, it's
// a wrong-password problem.
let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const tokens = getStoredTokens();
    if (
      error.response?.status === 401 &&
      tokens?.refreshToken &&
      !original._retried &&
      !original.url.includes('/auth/')
    ) {
      original._retried = true;
      try {
        refreshing =
          refreshing ||
          axios.post('/api/auth/refresh', { refreshToken: tokens.refreshToken });
        const { data } = await refreshing;
        refreshing = null;
        storeTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        // Refresh failed: the session is dead. Drop the tokens and broadcast
        // the logout — useAuth is listening and will clear the user state.
        refreshing = null;
        storeTokens(null);
        window.dispatchEvent(new Event('dbc:logout'));
      }
    }
    return Promise.reject(error);
  }
);

// Extract the most human-readable error the server offered: first validation
// issue, then the general error field, then the caller's fallback. Components
// get one string; nobody renders `[object Object]` on this site.
export function apiError(err, fallback = 'Something went wrong') {
  return (
    err.response?.data?.issues?.[0] ||
    err.response?.data?.error ||
    fallback
  );
}

// ---- Public endpoints (no auth required) ------------------------------------
export const getPortfolio = () => api.get('/portfolio').then((r) => r.data);
export const getTestimonials = () => api.get('/testimonials').then((r) => r.data);
export const sendContact = (body) => api.post('/contact', body).then((r) => r.data);
export const getMonthAvailability = (month) =>
  api.get('/bookings/availability', { params: { month } }).then((r) => r.data);
export const createBooking = (body) => api.post('/bookings', body).then((r) => r.data);

// ---- Auth -------------------------------------------------------------------
export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then((r) => r.data);
export const changePassword = (currentPassword, newPassword) =>
  api.post('/auth/change-password', { currentPassword, newPassword }).then((r) => r.data);

// ---- Client portal ----------------------------------------------------------
export const getPortalMe = () => api.get('/portal/me').then((r) => r.data);
export const portalFileUrl = (fileId) => `/api/portal/files/${fileId}`;
// Files need the Authorization header, so a plain <a href> won't do. We fetch
// the blob ourselves, mint a temporary object URL, click an invisible anchor,
// and revoke the URL before anyone notices the payload changed hands.
export const downloadPortalFile = async (fileId, filename) => {
  const fileResponse = await api.get(`/portal/files/${fileId}`, { responseType: 'blob' });
  const objectUrl = URL.createObjectURL(fileResponse.data);
  const downloadLink = document.createElement('a');
  downloadLink.href = objectUrl;
  downloadLink.download = filename;
  downloadLink.click();
  URL.revokeObjectURL(objectUrl);
};

// ---- Admin: bookings --------------------------------------------------------
export const adminGetBookings = () => api.get('/admin/bookings').then((r) => r.data);
export const adminUpdateBooking = (id, status) =>
  api.patch(`/admin/bookings/${id}`, { status }).then((r) => r.data);
export const adminDeleteBooking = (id) =>
  api.delete(`/admin/bookings/${id}`).then((r) => r.data);

// ---- Admin: availability ----------------------------------------------------
export const adminGetAvailability = () =>
  api.get('/admin/availability').then((r) => r.data);
export const adminUpdateDays = (days) =>
  api.put('/admin/availability', days).then((r) => r.data);
export const adminBlockDate = (date) =>
  api.post('/admin/availability/block', { date }).then((r) => r.data);
export const adminUnblockDate = (id) =>
  api.delete(`/admin/availability/block/${id}`).then((r) => r.data);

// ---- Admin: clients & their files -------------------------------------------
export const adminGetClients = () => api.get('/admin/clients').then((r) => r.data);
export const adminCreateClient = (body) =>
  api.post('/admin/clients', body).then((r) => r.data);
export const adminUpdateClient = (id, body) =>
  api.patch(`/admin/clients/${id}`, body).then((r) => r.data);
export const adminDeleteClient = (id) =>
  api.delete(`/admin/clients/${id}`).then((r) => r.data);
export const adminUploadClientFiles = (id, files, onProgress) => {
  const form = new FormData();
  for (const f of files) form.append('files', f);
  return api
    .post(`/admin/clients/${id}/files`, form, { onUploadProgress: onProgress })
    .then((r) => r.data);
};
export const adminDeleteClientFile = (id, fileId) =>
  api.delete(`/admin/clients/${id}/files/${fileId}`).then((r) => r.data);

// ---- Admin: portfolio -------------------------------------------------------
// Reads come from the public endpoint; only the writes need credentials.
export const adminGetPortfolioItems = () => api.get('/portfolio').then((r) => r.data);
export const adminCreatePortfolio = (form, onProgress) =>
  api
    .post('/admin/portfolio', form, { onUploadProgress: onProgress })
    .then((r) => r.data);
export const adminUpdatePortfolio = (id, body, onProgress) =>
  api
    .patch(`/admin/portfolio/${id}`, body, { onUploadProgress: onProgress })
    .then((r) => r.data);
export const adminDeletePortfolio = (id) =>
  api.delete(`/admin/portfolio/${id}`).then((r) => r.data);

// ---- Admin: testimonials ----------------------------------------------------
export const adminGetTestimonials = () =>
  api.get('/admin/testimonials').then((r) => r.data);
export const adminCreateTestimonial = (body) =>
  api.post('/admin/testimonials', body).then((r) => r.data);
export const adminUpdateTestimonial = (id, body) =>
  api.patch(`/admin/testimonials/${id}`, body).then((r) => r.data);
export const adminDeleteTestimonial = (id) =>
  api.delete(`/admin/testimonials/${id}`).then((r) => r.data);

// ---- Bloopers ---------------------------------------------------------------
// Public read + admin write. The page is hidden; the endpoint is not.
export const getBloopers = () => api.get('/bloopers').then((r) => r.data);
export const adminGetBloopers = () => api.get('/bloopers').then((r) => r.data);
export const adminCreateBlooper = (form, onProgress) =>
  api
    .post('/admin/bloopers', form, { onUploadProgress: onProgress })
    .then((r) => r.data);
export const adminUpdateBlooper = (id, body) =>
  api.patch(`/admin/bloopers/${id}`, body).then((r) => r.data);
export const adminDeleteBlooper = (id) =>
  api.delete(`/admin/bloopers/${id}`).then((r) => r.data);

// ---- Admin: settings --------------------------------------------------------
export const adminGetSettings = () => api.get('/admin/settings').then((r) => r.data);
export const adminUpdateSettings = (body) =>
  api.put('/admin/settings', body).then((r) => r.data);
export const adminUploadPart107 = (file) => {
  const form = new FormData();
  form.append('image', file);
  return api.post('/admin/settings/part107', form).then((r) => r.data);
};
export const adminGetGoogleAuthUrl = () =>
  api.get('/auth/google').then((r) => r.data);

export default api;
