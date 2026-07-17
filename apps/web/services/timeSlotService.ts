import { API } from '@/lib/api';

export const timeSlotService = {
  async getAll(workspaceId?: string) {
    try {
      const params = workspaceId ? `?workspaceId=${workspaceId}` : '';
      return await API.get(`/api/time-slots${params}`);
    } catch (error: any) {
      console.error('[timeSlotService] Erreur getAll:', error);
      throw error;
    }
  },

  async getAvailable(date: string, workspaceId?: string) {
    try {
      const params = workspaceId 
        ? `?date=${date}&workspaceId=${workspaceId}` 
        : `?date=${date}`;
      return await API.get(`/api/time-slots/available${params}`);
    } catch (error: any) {
      console.error('[timeSlotService] Erreur getAvailable:', error);
      throw error;
    }
  },
};