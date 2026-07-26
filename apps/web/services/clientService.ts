import { API } from '@/lib/api';

export interface ClientContact {
  id: string;
  first_name: string;
  last_name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  is_primary: boolean;
  receives_proforma: boolean;
  receives_invoice: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface Client {
  id: string;
  _id?: string;
  name: string;
  email?: string;
  phone?: string;
  type?: 'INDIVIDUAL' | 'COMPANY';

  company_name?: string | null;
  trade_name?: string | null;
  registration_number?: string | null;
  vat_number?: string | null;
  address?: string | null;
  billing_address?: string | null;
  payment_terms_days?: number;
  credit_limit?: number | null;

  contacts?: ClientContact[];
  vehicles?: any[];
  appointments?: any[];
  invoices?: any[];
  cases?: any[];

  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface CreateClientPayload {
  workspaceId: string;
  name: string;
  email?: string;
  phone?: string;
  type?: 'INDIVIDUAL' | 'COMPANY';
  company_name?: string;
  trade_name?: string;
  registration_number?: string;
  vat_number?: string;
  address?: string;
  billing_address?: string;
  payment_terms_days?: number;
  credit_limit?: number;
}

export type UpdateClientPayload = Partial<
  Omit<CreateClientPayload, 'workspaceId'>
>;

export const clientService = {
  async getAll(workspaceId: string): Promise<Client[]> {
    if (!workspaceId) {
      throw new Error('workspaceId est requis');
    }

    return API.get<Client[]>(`/api/clients/${workspaceId}`);
  },

  async getOne(id: string): Promise<Client> {
    return API.get<Client>(`/api/clients/one/${id}`);
  },

  async create(data: CreateClientPayload): Promise<Client> {
    const workspaceId =
      data.workspaceId ??
      localStorage.getItem('current_workspace_id');

    if (!workspaceId) {
      throw new Error('Aucun workspace sélectionné');
    }

    return API.post<Client>('/api/clients', {
      ...data,
      workspaceId,
    });
  },

  async update(
    id: string,
    data: UpdateClientPayload,
  ): Promise<Client> {
    return API.patch<Client>(`/api/clients/${id}`, data);
  },

  async delete(id: string) {
    return API.patch(`/api/clients/${id}/soft-delete`);
  },

  async softDelete(id: string) {
    return API.patch(`/api/clients/${id}/soft-delete`);
  },

  async restore(id: string) {
    return API.patch(`/api/clients/${id}/restore`);
  },

  async hardDelete(id: string) {
    return API.delete(`/api/clients/${id}/hard`);
  },
};
