import api from './api';

export const timetableService = {
  getAll: async () => {
    const response = await api.get('/timetable/');
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/timetable/', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.put(`/timetable/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/timetable/${id}`);
    return response.data;
  },
};
