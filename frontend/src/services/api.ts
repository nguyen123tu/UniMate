import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Không xử lý logout nếu đang gọi API đăng nhập/đăng ký
    const isAuthRoute = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
    
    if (error.response && error.response.status === 401 && !isAuthRoute) {
      // Token hết hạn hoặc không hợp lệ -> đăng xuất (ProtectedRoute sẽ tự đá ra /login)
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
