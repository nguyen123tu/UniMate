import api from './api';

export const aiService = {
  breakdownTask: async (payload: { task_title: string; task_description?: string; subject_name?: string; deadline?: string; estimated_minutes?: number; }): Promise<{ subtasks: any[] }> => {
    const response = await api.post('/ai/breakdown-task', payload);
    return response.data;
  }
};
