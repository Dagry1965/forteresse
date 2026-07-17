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

  async create(data: any) {
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
