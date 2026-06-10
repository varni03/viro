import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' }
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
