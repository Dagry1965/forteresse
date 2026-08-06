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

  // Atelier
  caseId?: string | null;
  case_id?: string | null;
  case?: { id: string; status?: string } | null;
  repairCase?: { id: string; status?: string } | null;
}

export interface AppointmentPayload {
  clientId: string;
  vehicleId: string;
  date: string;
  workspaceId?: string;
  timeSlotId?: string;
  startTime?: string;
  endTime?: string;
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

export interface StartWorkshopResult {
  id?: string;
  caseId?: string;
  case_id?: string;
  case?: { id: string; status?: string };
  data?: {
    id?: string;
    caseId?: string;
    case_id?: string;
    case?: { id: string; status?: string };
  };
}

export const appointmentService = {
  async getAll(workspaceId?: string) {
    const params = workspaceId ? `?workspaceId=${workspaceId}` : '';
    return API.get<Appointment[]>(`/api/appointments${params}`);
  },

  async getPending(workspaceId?: string) {
    const params = workspaceId ? `?workspaceId=${workspaceId}` : '';
    return API.get<Appointment[]>(`/api/appointments/pending${params}`);
  },

  async create(data: AppointmentPayload) {
    return API.post('/api/appointments', data);
  },

  async update(id: string, data: Partial<AppointmentPayload>) {
    return API.patch(`/api/appointments/${id}`, data);
  },

  async cancel(id: string) {
    return API.patch(`/api/appointments/${id}/cancel`);
  },

  async remove(id: string) {
    return API.delete(`/api/appointments/${id}`);
  },

  async restore(id: string) {
    return API.patch(`/api/appointments/${id}/restore`);
  },

  async getAvailableSlots(date: string, workspaceId?: string) {
    const params = new URLSearchParams({
      date,
      ...(workspaceId ? { workspaceId } : {}),
    });

    return API.get<AvailableTimeSlot[]>(
      `/api/appointments/available-slots?${params.toString()}`,
    );
  },

  async validate(id: string, action: 'confirm' | 'cancel') {
    const status =
      action === 'confirm'
        ? APPOINTMENT_STATUS.CONFIRMED
        : APPOINTMENT_STATUS.CANCELLED;

    return API.patch(`/api/appointments/${id}`, { status });
  },

  async startIntervention(id: string) {
    return API.post<StartWorkshopResult>(
      `/api/appointments/${id}/start-workshop`,
    );
  },
};
