import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 45000, // 45s for AI multimodal generation
  headers: {
    'Accept': 'application/json',
  },
});

export const apiClient = {
  // Health & System
  getHealth: () => api.get('/health').then(r => r.data),
  getSettings: () => api.get('/settings').then(r => r.data),
  testAI: () => api.post('/settings/test-ai').then(r => r.data),

  // Projects
  getProjects: () => api.get('/projects').then(r => r.data),
  createProject: (data) => api.post('/projects', data).then(r => r.data),

  // Dashboard
  getDashboardStats: () => api.get('/dashboard/stats').then(r => r.data),

  // Site Safety
  analyzeSafety: (formData) => api.post('/safety/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data),
  getSafetyInspections: () => api.get('/safety/inspections').then(r => r.data),

  // Crack Detection
  analyzeCracks: (formData) => api.post('/cracks/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data),
  getCrackAnalyses: () => api.get('/cracks/analyses').then(r => r.data),

  // Valuation
  estimateValuation: (data) => api.post('/valuation/estimate', data).then(r => r.data),
  getValuations: () => api.get('/valuation/estimates').then(r => r.data),

  // Planning
  generatePlan: (data) => api.post('/planning/generate', data).then(r => r.data),
  getPlans: () => api.get('/planning').then(r => r.data),
  getPlanById: (id) => api.get(`/planning/${id}`).then(r => r.data),
  updateTaskStatus: (planId, taskId, status) =>
    api.patch(`/planning/${planId}/tasks/${taskId}`, { status }).then(r => r.data),
  deletePlan: (id) => api.delete(`/planning/${id}`).then(r => r.data),

  // Assistant
  sendChat: (data) => api.post('/assistant/chat', data).then(r => r.data),
  getChatHistory: (sessionId) => api.get(`/assistant/history/${sessionId}`).then(r => r.data),

  // Weather
  getWeatherAdvisory: (location, activity) =>
    api.get(`/weather/advisory?location=${encodeURIComponent(location)}&activity=${encodeURIComponent(activity)}`).then(r => r.data),
  postWeatherAdvisory: (data) => api.post('/weather/advisory', data).then(r => r.data),

  // History
  getHistory: (params = {}) => {
    const query = new URLSearchParams();
    if (params.module_type) query.append('module_type', params.module_type);
    if (params.search) query.append('search', params.search);
    return api.get(`/history?${query.toString()}`).then(r => r.data);
  },
  deleteHistoryItem: (id, moduleType) =>
    api.delete(`/history/${id}?module_type=${encodeURIComponent(moduleType)}`).then(r => r.data),
};

export default api;
