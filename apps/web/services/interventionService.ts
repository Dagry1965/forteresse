import { API } from '../lib/api';

// ====================== INTERFACES (Typage) ======================

export interface Case {
  id: string;
  status: string;
  title: string;
  description?: string;
  client?: {
    name: string;
    phone: string;
    email: string;
  };
  vehicle?: {
    brand: string;
    model: string;
    registration: string;
  };
  interventions?: Intervention[];
  proformas?: {
    id: string;
    reference: string;
    status: string;
    created_at: string;
  }[];
}

export interface Intervention {
  id: string;
  description: string;
  status: 'PENDING' | 'DIAGNOSIS' | 'IN_PROGRESS' | 'COMPLETED';
  created_at: string;
  case_id?: string;
  case?: Case;
  InterventionPart?: any[];
}

// ====================== SERVICE FRONTEND ======================

export const interventionService = {
  /**
   * Lister toutes les interventions (Vue Atelier)
   */
  async getAll() {
    return API.get<Intervention[]>('/api/workshop/interventions');
  },

  /**
   * Récupérer une intervention précise
   */
  async getOne(id: string) {
    return API.get<Intervention>(
      `/api/workshop/interventions/${id}`,
    );
  },

  /**
   * Récupérer le dossier complet (Multi-Phases)
   */
  async getCaseDetails(caseId: string) {
    return API.get<Case>(
      `/api/workshop/interventions/case/${caseId}`,
    );
  },

  /**
   * Créer une nouvelle phase dans le dossier
   */
  async createNewPhase(caseId: string, description: string) {
    return API.post(
      `/api/workshop/interventions/case/${caseId}/phase`,
      {
        description,
      },
    );
  },

  /**
   * Mettre à jour une phase
   */
  async update(id: string, data: Partial<Intervention>) {
    return API.patch<Intervention>(
      `/api/workshop/interventions/${id}`,
      data,
    );
  },

  /**
   * Ajouter une pièce à une phase précise
   */
  async addPart(
    interventionId: string,
    data: {
      item_id: string;
      quantity: number;
    },
  ) {
    return API.post(
      `/api/workshop/interventions/${interventionId}/parts`,
      data,
    );
  },

  /**
   * Retirer une pièce
   */
  async removePart(partId: string) {
    return API.delete(
      `/api/workshop/interventions/parts/${partId}`,
    );
  },

  /**
   * Générer la proforma globale du dossier
   */
  async generateProforma(caseId: string) {
    return API.post(
      `/api/workshop/interventions/case/${caseId}/proforma`,
    );
  },

  /**
   * Récupérer les statistiques atelier
   */
  async getMetrics() {
    return API.get('/api/workshop/interventions/metrics');
  },

  /**
   * Mettre à jour le statut global du dossier
   */
  async updateCaseStatus(caseId: string, status: string) {
    return API.patch(
      `/api/workshop/interventions/case/${caseId}/status`,
      {
        status,
      },
    );
  },
};