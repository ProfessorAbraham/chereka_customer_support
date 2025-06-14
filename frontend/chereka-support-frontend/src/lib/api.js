import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
};

// Tickets API
export const ticketsAPI = {
  getAll: (params) => api.get('/tickets', { params }).then(res => res.data),
  getById: (id) => api.get(`/tickets/${id}`).then(res => res.data),
  create: (ticketData) => api.post('/tickets', ticketData).then(res => res.data),
  update: (id, updates) => api.put(`/tickets/${id}`, updates).then(res => res.data),
  delete: (id) => api.delete(`/tickets/${id}`).then(res => res.data),
  assign: (id, agentId) => api.post(`/tickets/${id}/assign`, { agentId }).then(res => res.data),
  addMessage: (id, message) => api.post(`/tickets/${id}/messages`, message).then(res => res.data),
  getMessages: (id) => api.get(`/tickets/${id}/messages`).then(res => res.data),
  getStats: () => api.get('/tickets/stats').then(res => res.data),
};

// Chat API
export const chatAPI = {
  getOrCreateRoom: (subject) => api.post('/chat/room', { subject }).then(res => res.data),
  getRooms: (params) => api.get('/chat/rooms', { params }).then(res => res.data),
  getRoom: (id) => api.get(`/chat/rooms/${id}`).then(res => res.data),
  joinRoom: (id) => api.post(`/chat/rooms/${id}/join`).then(res => res.data),
  closeRoom: (id) => api.post(`/chat/rooms/${id}/close`).then(res => res.data),
  getMessages: (id, params) => api.get(`/chat/rooms/${id}/messages`, { params }).then(res => res.data),
  sendMessage: (id, message) => api.post(`/chat/rooms/${id}/messages`, message).then(res => res.data),
  getStats: () => api.get('/chat/stats').then(res => res.data),
};

// Analytics API
export const analyticsAPI = {
  getOverview: (params) => api.get('/analytics/overview', { params }).then(res => res.data),
  getTicketTrends: (params) => api.get('/analytics/ticket-trends', { params }).then(res => res.data),
  getTicketDistribution: (params) => api.get('/analytics/ticket-distribution', { params }).then(res => res.data),
  getAgentPerformance: (params) => api.get('/analytics/agent-performance', { params }).then(res => res.data),
  getSatisfaction: (params) => api.get('/analytics/satisfaction', { params }).then(res => res.data),
  getActivity: (params) => api.get('/analytics/activity', { params }).then(res => res.data),
};

// Knowledge Base API
export const knowledgeBaseAPI = {
  getArticles: (params) => api.get('/knowledge-base/articles', { params }).then(res => res.data),
  getArticle: (slug) => api.get(`/knowledge-base/articles/${slug}`).then(res => res.data),
  createArticle: (articleData) => api.post('/knowledge-base/articles', articleData).then(res => res.data),
  updateArticle: (id, articleData) => api.put(`/knowledge-base/articles/${id}`, articleData).then(res => res.data),
  deleteArticle: (id) => api.delete(`/knowledge-base/articles/${id}`).then(res => res.data),
  rateArticle: (id, rating) => api.post(`/knowledge-base/articles/${id}/rate`, rating).then(res => res.data),
  getCategories: () => api.get('/knowledge-base/categories').then(res => res.data),
  createCategory: (categoryData) => api.post('/knowledge-base/categories', categoryData).then(res => res.data),
  getTags: () => api.get('/knowledge-base/tags').then(res => res.data),
  searchArticles: (params) => api.get('/knowledge-base/search', { params }).then(res => res.data),
};

// Admin API
export const adminAPI = {
  // User management
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserDetails: (id) => api.get(`/admin/users/${id}`),
  createUser: (userData) => api.post('/admin/users', userData),
  updateUser: (id, updates) => api.put(`/admin/users/${id}`, updates),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  toggleUserStatus: (id) => api.patch(`/admin/users/${id}/toggle-status`),
  resetUserPassword: (id, data) => api.post(`/admin/users/${id}/reset-password`, data),
  getUserStats: () => api.get('/admin/users/stats'),

  // Settings
  getSettings: () => api.get('/settings'),
  updateSetting: (key, data) => api.put(`/settings/${key}`, data),
  createSetting: (data) => api.post('/settings', data),
  deleteSetting: (key) => api.delete(`/settings/${key}`),
  getEmailTemplates: () => api.get('/settings/email-templates'),
  updateEmailTemplate: (id, data) => api.put(`/settings/email-templates/${id}`, data),
  getSystemStats: () => api.get('/settings/system-stats'),
  getSystemHealth: () => api.get('/settings/system-health'),
  createBackup: () => api.post('/settings/backup')
};

export default api;

