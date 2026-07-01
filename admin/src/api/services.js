import api from './client';

// Unwrap the backend's { success, message, data } envelope.
const data = (res) => res.data?.data ?? res.data;

export const authApi = {
  login: (payload) => api.post('/admin/auth/login', payload).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
};

export const dashboardApi = {
  stats: () => api.get('/admin/dashboard').then(data),
};

/** Factory for a standard CRUD resource under /admin. */
function crud(path) {
  return {
    list: () => api.get(`/admin/${path}`).then(data),
    get: (id) => api.get(`/admin/${path}/${id}`).then(data),
    create: (payload) => api.post(`/admin/${path}`, payload).then(data),
    update: (id, payload) => api.put(`/admin/${path}/${id}`, payload).then(data),
    remove: (id) => api.delete(`/admin/${path}/${id}`).then((r) => r.data),
  };
}

export const cropsApi = crud('crops');
export const stagesApi = crud('stages');
export const diseasesApi = crud('diseases');
export const diseaseRulesApi = crud('disease-rules');
export const riskLevelsApi = crud('risk-levels');
export const nutrientRulesApi = crud('nutrient-rules');

export const farmersApi = {
  list: () => api.get('/admin/farmers').then(data),
  get: (id) => api.get(`/admin/farmers/${id}`).then(data),
  remove: (id) => api.delete(`/admin/farmers/${id}`).then((r) => r.data),
};

export const fieldsApi = {
  list: () => api.get('/admin/fields').then(data),
  get: (id) => api.get(`/admin/fields/${id}`).then(data),
  remove: (id) => api.delete(`/admin/fields/${id}`).then((r) => r.data),
};
