import api from './client';

// Unwrap { success, message, data } envelope. The advisory endpoint returns the
// advisory fields at the top level (not under `data`), so callers handle that.
const unwrap = (res) => res.data?.data ?? res.data;

export const authApi = {
  signup: (payload) => api.post('/auth/signup', payload).then((r) => r.data),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
};

export const profileApi = {
  get: () => api.get('/profile').then(unwrap),
  update: (payload) => api.put('/profile', payload).then(unwrap),
};

export const cropsApi = {
  list: () => api.get('/crops').then(unwrap),
  stages: (cropId) => api.get(`/crops/${cropId}/stages`).then(unwrap),
  diseases: (cropId) => api.get(`/crops/${cropId}/diseases`).then(unwrap),
};

export const fieldsApi = {
  list: () => api.get('/fields').then(unwrap),
  get: (id) => api.get(`/fields/${id}`).then(unwrap),
  create: (payload) => api.post('/fields', payload).then(unwrap),
  update: (id, payload) => api.put(`/fields/${id}`, payload).then(unwrap),
  remove: (id) => api.delete(`/fields/${id}`).then((r) => r.data),
};

export const soilApi = {
  create: (fieldId, payload) =>
    api.post(`/fields/${fieldId}/soil-reports`, payload).then(unwrap),
  latest: (fieldId) => api.get(`/fields/${fieldId}/soil-reports/latest`).then(unwrap),
  history: (fieldId) => api.get(`/fields/${fieldId}/soil-reports`).then(unwrap),
  remove: (id) => api.delete(`/soil-reports/${id}`).then((r) => r.data),
};

export const advisoryApi = {
  // Returns the full top-level advisory payload (success, field, cropStage, ...).
  generate: (fieldId) => api.get(`/fields/${fieldId}/advisory`).then((r) => r.data),
  history: (fieldId) => api.get(`/fields/${fieldId}/advisories`).then(unwrap),
  remove: (fieldId, advisoryId) =>
    api.delete(`/fields/${fieldId}/advisories/${advisoryId}`).then((r) => r.data),
};
