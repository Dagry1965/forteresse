import { API } from '@/lib/api';

export interface WorkshopIntervention {
  id: string;
  case_id?: string | null;
  caseId?: string | null;
  description?: string;
  status?: string;
  case?: {
    id: string;
    client?: {
      id: string;
      name: string;
    };
    vehicle?: {
      id: string;
      brand?: string;
      make?: string;
      model?: string;
      registration?: string;
      plateNumber?: string;
    };
  };
}

export interface CreateWorkshopInterventionPayload {
  case_id: string;
  appointment_id?: string;
  description: string;
  mechanic_id?: string;
  priority?: string;
  diagnostic?: string;
  planned_minutes?: number;
  actual_minutes?: number;
  hourly_rate?: number;
  quality_control_status?: string;
  quality_control_notes?: string;
  parts?: Array<{
    item_id: string;
    quantity: number;
    price_snapshot?: number;
  }>;
}

export const workshopService = {
  async getAll() {
    return API.get<WorkshopIntervention[]>(
      '/api/workshop/interventions',
    );
  },

  async getOne(id: string) {
    return API.get<WorkshopIntervention>(
      `/api/workshop/interventions/${id}`,
    );
  },

  async create(data: CreateWorkshopInterventionPayload) {
    return API.post('/api/workshop/interventions', data);
  },

  async updateStatus(id: string, status: string) {
    return API.patch(`/api/workshop/interventions/${id}`, {
      status,
    });
  },

  async generateProforma(caseId: string) {
    return API.post(
      `/api/workshop/interventions/case/${caseId}/proforma`,
      {},
    );
  },

  async getCaseDetails(caseId: string) {
    return API.get(
      `/api/workshop/interventions/case/${caseId}`,
    );
  },
};
