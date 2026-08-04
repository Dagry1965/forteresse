import { API } from '../lib/api';
import { APPOINTMENT_STATUS } from '../../../shared/constants/status.constants';

export interface Appointment {
  id: string;
  date: string;
  status: string;
  startTime?: string;
  endTime?: string;
  client?: { id: string; name: string };
  vehicle?: {
    id: string;
    brand?: string;
    make?: string;
    model?: string;
    registration?: string;
    plateNumber?: string;
  };
  time_slot?: { id: string; start: string; end: string };
}

export interface AvailableTimeSlot {
  id?: string;
  start: string;
  end: string;
  label?: string;
  booked?: number;
  available?: number;
  isAvailable?: boolean;
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
      console.error('[appointmentService] Erreur création:', error);
      throw error;
    }
  },

  async update(id: string, data: any) {
    try {
      return await API.patch(`/api/appointments/${id}`, data);
    } catch (error: any) {
      console.error('[appointmentService] Erreur mise à jour:', error);
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

    return await API.get<AvailableTimeSlot[]>(
      `/api/appointments/available-slots?${params.toString()}`
    );
  } catch (error: any) {
    console.error('[appointmentService] Erreur getAvailableSlots:', error);
    throw error;
  }
},


  async validate(id: string, action: "confirm" | "cancel") {
    try {
      const status = action === "confirm" ? APPOINTMENT_STATUS.CONFIRMED : APPOINTMENT_STATUS.CANCELLED;

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

