import { API } from '../lib/api';

export interface CreateProformaPayload {
  intervention_id: string;
  lines?: Array<{
    product_id?: string | null;
    description: string;
    quantity: number;
    unit_price: number;
  }>;
}

export const proformaService = {
  async getAll() {
    return API.get('/api/proformas');
  },

  async getOne(id: string) {
    return API.get(`/api/proformas/${id}`);
  },

  async create(payload: CreateProformaPayload) {
    const intervention = await API.get<{
      id: string;
      case_id?: string | null;
      caseId?: string | null;
      case?: {
        id: string;
      };
    }>(
      `/api/workshop/interventions/${payload.intervention_id}`,
    );

    const caseId =
      intervention.case_id ||
      intervention.caseId ||
      intervention.case?.id;

    if (!caseId) {
      throw new Error(
        "Cette intervention n'est associée à aucun dossier.",
      );
    }

    return API.post(
      `/api/workshop/interventions/case/${caseId}/proforma`,
      {},
    );
  },

  async acceptProforma(id: string) {
    return API.post(`/api/proformas/${id}/accept`);
  },

  async convertToInvoice(id: string) {
    return API.post<{ id: string; reference: string }>(
      `/api/proformas/${id}/invoice`,
    );
  },
};
