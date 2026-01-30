import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Try to refresh the token
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        }, { withCredentials: true });

        const { accessToken } = response.data.data;
        
        // Update the token in store
        useAuthStore.getState().setAccessToken(accessToken);

        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, logout user
        useAuthStore.getState().logout();
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  getMe: () => api.get('/auth/me'),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data),
  searchUsers: (params) => api.get('/users/search', { params }),
  getTeachers: (params) => api.get('/users/teachers', { params }),
  getStudents: (params) => api.get('/users/students', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
};

// Classroom API
export const classroomAPI = {
  create: (data) => api.post('/classrooms', data),
  getTeacherClassrooms: (params) => api.get('/classrooms', { params }),
  getStudentClassrooms: (params) => api.get('/classrooms/enrolled', { params }),
  getById: (id) => api.get(`/classrooms/${id}`),
  update: (id, data) => api.put(`/classrooms/${id}`, data),
  delete: (id) => api.delete(`/classrooms/${id}`),
  archive: (id) => api.put(`/classrooms/${id}/archive`),
  joinByCode: (code) => api.post('/classrooms/join', { code }),
  leave: (id) => api.post(`/classrooms/${id}/leave`),
  getStudents: (id) => api.get(`/classrooms/${id}/students`),
  removeStudent: (classroomId, studentId) => api.delete(`/classrooms/${classroomId}/students/${studentId}`),
  getTeams: (classroomId, params) => api.get(`/classrooms/${classroomId}/teams`, { params }),
  exportEvaluations: (id, format) => api.get(`/classrooms/${id}/export`, { 
    params: { format },
    responseType: 'blob',
  }),
};

// Team API
export const teamAPI = {
  create: (data) => api.post('/teams', data),
  getMyTeams: (params) => api.get('/teams', { params }),
  getById: (id) => api.get(`/teams/${id}`),
  update: (id, data) => api.put(`/teams/${id}`, data),
  delete: (id) => api.delete(`/teams/${id}`),
  addMember: (id, userId) => api.post(`/teams/${id}/members`, { userId }),
  removeMember: (teamId, memberId) => api.delete(`/teams/${teamId}/members/${memberId}`),
  leave: (id) => api.post(`/teams/${id}/leave`),
  transferLeadership: (id, newLeaderId) => api.put(`/teams/${id}/transfer-leadership`, { newLeaderId }),
  submit: (id, data) => api.post(`/teams/${id}/submit`, data),
  finalSubmit: (id) => api.post(`/teams/${id}/final-submit`),
  evaluate: (id, data) => api.post(`/teams/${id}/evaluate`, data),
  lockEvaluation: (id) => api.post(`/teams/${id}/lock-evaluation`),
  getByClassroom: (classroomId) => api.get(`/classrooms/${classroomId}/teams`),
  requestToJoin: (id, message) => api.post(`/teams/${id}/join-request`, { message }),
  cancelJoinRequest: (id) => api.delete(`/teams/${id}/join-request`),
  getJoinRequests: (id) => api.get(`/teams/${id}/join-requests`),
  processJoinRequest: (teamId, requestId, status) => api.put(`/teams/${teamId}/join-requests/${requestId}`, { status }),
};

// Project API
export const projectAPI = {
  create: (data) => api.post('/projects', data),
  getMyProjects: (params) => api.get('/projects', { params }),
  getPublicProjects: (params) => api.get('/projects/public', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  removeMember: (projectId, memberId) => api.delete(`/projects/${projectId}/members/${memberId}`),
  updateMemberRole: (projectId, memberId, role) => api.put(`/projects/${projectId}/members/${memberId}/role`, { role }),
  addMentor: (id, userId) => api.post(`/projects/${id}/mentors`, { userId }),
  leave: (id) => api.post(`/projects/${id}/leave`),
  requestToJoin: (id, message) => api.post(`/projects/${id}/join-request`, { message }),
  getJoinRequests: (id) => api.get(`/projects/${id}/join-requests`),
  processJoinRequest: (projectId, requestId, status) => api.put(`/projects/${projectId}/join-request/${requestId}`, { status }),
};

// Chat API
export const chatAPI = {
  getRooms: () => api.get('/chat/rooms'),
  getRoomById: (id) => api.get(`/chat/rooms/${id}`),
  getMessages: (roomId, params) => api.get(`/chat/rooms/${roomId}/messages`, { params }),
  sendMessage: (roomId, data) => api.post(`/chat/rooms/${roomId}/messages`, data),
  createDirectMessage: (recipientId) => api.post('/chat/direct', { recipientId }),
  createTeamReviewChat: (teamId) => api.post(`/chat/team-review/${teamId}`),
  getTeamInternalChat: (teamId) => api.get(`/chat/team-internal/${teamId}`),
  getProjectChat: (projectId) => api.get(`/chat/project/${projectId}`),
  getClassroomChat: (classroomId) => api.get(`/chat/classroom/${classroomId}`),
  editMessage: (id, content) => api.put(`/chat/messages/${id}`, { content }),
  deleteMessage: (id) => api.delete(`/chat/messages/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getStudentDashboard: () => api.get('/dashboard/student'),
  getTeacherDashboard: () => api.get('/dashboard/teacher'),
  getStats: () => api.get('/dashboard/stats'),
};
