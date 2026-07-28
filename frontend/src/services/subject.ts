import api from './api';
import type { Subject, SubjectCreate, SubjectUpdate } from '../types';

export const subjectService = {
  getAll: async (): Promise<Subject[]> => {
    const response = await api.get('/subjects/');
    return response.data;
  },
  create: async (data: SubjectCreate): Promise<Subject> => {
    const response = await api.post('/subjects/', data);
    return response.data;
  },
  update: async (id: string, data: SubjectUpdate): Promise<Subject> => {
    const response = await api.put(`/subjects/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/subjects/${id}`);
  },
};
