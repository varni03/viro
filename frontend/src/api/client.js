import axios from 'axios';

const API = axios.create({
  baseURL: 'https://web-production-0457e.up.railway.app',
  headers: { 'Content-Type': 'application/json' }
});

// AI endpoints require the login JWT — attach it to every request.
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('viro_token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getCompanies = () => API.get('/companies');
export const getProducts = (companyId) => API.get(`/products/${companyId}`);
export const getDefects = (companyId, productId = null) => {
  if (productId) {
    return API.get(`/defects/${companyId}/${productId}`);
  }
  return API.get(`/defects/${companyId}`);
};
export const getDefectsByStage = (companyId) => API.get(`/defects/by-stage/${companyId}`);
export const getAtRisk = (companyId) => API.get(`/predictive/at-risk/${companyId}`);
export const getStageHealth = (companyId) => API.get(`/predictive/stage-health/${companyId}`);
export const getTrends = (companyId) => API.get(`/analytics/trends/${companyId}`);
export const logDefect = (data) => API.post('/defects', data);
export const analyzeImage = (formData) => API.post('/defects/analyze-image', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const askAI = (question, companyId, history) => API.post('/ai/ask', {
  question,
  company_id: companyId,
  history
});
export const getFilteredDefects = (data) => API.post('/defects/filtered', data);
export const interpretFilters = (data) => API.post('/ai/interpret-filters', data);
export const login = (email, password) => API.post('/auth/login', { email, password });
export const register = (data) => API.post('/auth/register', data);
export const getMe = (token) => API.get('/auth/me', {
  headers: { Authorization: `Bearer ${token}` }
});
export const getProductionLine = (companyId) => API.get(`/production/line/${companyId}`);
export const resolveDefect = (defectId) => API.put(`/defects/${defectId}/resolve`);
export const updateStage = (productId, stage, companyId) => 
  API.put(`/products/${productId}/stage?stage=${stage}&company_id=${companyId}`);
export const updateStatus = (productId, status, companyId) =>
  API.put(`/products/${productId}/status?status=${status}&company_id=${companyId}`);
export const getModules = (companyId) => API.get(`/modules/${companyId}`);
export const saveModules = (companyId, modules) => API.post(`/modules/${companyId}`, { modules });
