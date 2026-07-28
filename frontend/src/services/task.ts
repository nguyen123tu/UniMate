import api from './api';
import type { Task, TaskCreate, TaskUpdate, PaginatedResponse } from '../types';

export const taskService = {
  getAll: async (params?: Record<string, any>): Promise<PaginatedResponse<Task>> => {
    const response = await api.get('/tasks/', { params });
    return response.data;
  },
  getById: async (id: string): Promise<Task> => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },
  create: async (data: TaskCreate): Promise<Task> => {
    const response = await api.post('/tasks/', data);
    return response.data;
  },
  update: async (id: string, data: TaskUpdate): Promise<Task> => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },
  patch: async (id: string, data: TaskUpdate): Promise<Task> => {
    const response = await api.patch(`/tasks/${id}`, data);
    return response.data;
  },
  delete: async (id: string, deleteSubtasks: boolean = false): Promise<void> => {
    await api.delete(`/tasks/${id}?delete_subtasks=${deleteSubtasks}`);
  },
  bulkComplete: async (taskIds: string[]): Promise<void> => {
    await api.post('/tasks/bulk-complete', { task_ids: taskIds });
  },
  bulkDelete: async (taskIds: string[], deleteSubtasks: boolean = false): Promise<void> => {
    await api.post('/tasks/bulk-delete', { task_ids: taskIds, delete_subtasks: deleteSubtasks });
  },
  bulkCreateSubtasks: async (taskId: string, subtasks: TaskCreate[]): Promise<Task[]> => {
    const response = await api.post(`/tasks/${taskId}/subtasks/bulk`, subtasks);
    return response.data;
  }
};
