import api from './api';

export const pomodoroService = {
  create: async (data: { duration_minutes: number; task_id?: string; subject_id?: string; status?: string; start_time?: string }) => {
    const response = await api.post('/pomodoro/', data);
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/pomodoro/');
    return response.data;
  }
};
