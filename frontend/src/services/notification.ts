import api from './api';
import type { Notification } from '../types';

export const notificationService = {
  getAll: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications/');
    return response.data;
  }
};
