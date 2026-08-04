import { API } from '@/lib/api';

export interface TimeSlot {
  id: string;
  start: string;
  end: string;
  date?: string;
  available?: boolean;
}

export const timeSlotService = {
  async getAll(workspaceId?: string) {
    try {
      const params = workspaceId ? `?workspaceId=${workspaceId}` : '';
      return await API.get<TimeSlot[]>(`/api/time-slots${params}`);
    } catch (error: unknown) {
      console.error('[timeSlotService] Erreur getAll:', error);
      throw error;
    }
  },

  async getAvailable(date: string, workspaceId?: string) {
    try {
      const params = workspaceId 
        ? `?date=${date}&workspaceId=${workspaceId}` 
        : `?date=${date}`;
      return await API.get<TimeSlot[]>(`/api/time-slots/available${params}`);
    } catch (error: unknown) {
      console.error('[timeSlotService] Erreur getAvailable:', error);
      throw error;
    }
  },
};