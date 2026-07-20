import { API } from '../lib/api';

export interface Appointment {
  id: string;
  date: string;
  status: string;
  client?: { id: string; name: string };
  vehicle?: { id: string; make: string; model: string; plateNumber: string };
  time_slot?: { id: string; start: string; end: string };
}

export const appointmentService = {
  async getAll(workspaceId?: string) {
    try {
      const params = workspaceId ? `?workspaceId=${workspaceId}` : '';
      return await API.get<Appointment[]>(`/api/appointments${params}`);
    } catch (error: any) {
      console.error('[appointmentService] Erreur getAll:', error);
      throw error;
    }
  },

  async getPending(workspaceId?: string) {
    try {
      const params = workspaceId ? `?workspaceId=${workspaceId}` : '';
      return await API.get<Appointment[]>(`/api/appointments/pending${params}`);
    } catch (error: any) {
      console.error('[appointmentService] Erreur getPending:', error);
      throw error;
    }
  },

  async create(data: any) {
    try {
      return await API.post('/api/appointments', data);
    } catch (error: any) {
      console.error('[appointmentService] Erreur crÃ©ation:', error);
      throw error;
    }
  },

  async update(id: string, data: any) {
    try {
      return await API.patch(`/api/appointments/${id}`, data);
    } catch (error: any) {
      console.error('[appointmentService] Erreur mise Ã  jour:', error);
      throw error;
    }
  },

  async cancel(id: string) {
    try {
      return await API.patch(`/api/appointments/${id}/cancel`);
    } catch (error: any) {
      console.error('[appointmentService] Erreur annulation:', error);
      throw error;
    }
  },

  async remove(id: string) {
    try {
      return await API.delete(`/api/appointments/${id}`);
    } catch (error: any) {
      console.error('[appointmentService] Erreur suppression:', error);
      throw error;
    }
  },

  async restore(id: string) {
    try {
      return await API.patch(`/api/appointments/${id}/restore`);
    } catch (error: any) {
      console.error('[appointmentService] Erreur restore:', error);
      throw error;
    }
  },

  async getAvailableSlots(date: string, workspaceId?: string) {
  try {
    const params = new URLSearchParams({
      date,
      ...(workspaceId ? { workspaceId } : {}),
    });

    return await API.get(
      `/api/time-slots/available?${params.toString()}`
    );
  } catch (error: any) {
    console.error('[appointmentService] Erreur getAvailableSlots:', error);
    throw error;
  }
},


  async validate(id: string, action: "confirm" | "cancel") {
    try {
      const status = action === "confirm" ? "CONFIRMED" : "CANCELLED";

      return await API.patch(`/api/appointments/${id}`, {
        status,
      });
    } catch (error: any) {
      console.error("[appointmentService] Erreur validation:", error);
      throw error;
    }
  },

async startIntervention(id: string) {
  try {
    return await API.post(`/api/appointments/${id}/start-workshop`);
  } catch (error: any) {
    console.error('[appointmentService] Erreur startIntervention:', error);
    throw error;
  }
},




};

