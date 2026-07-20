import { API } from '@/lib/api';

export interface Client {
  id: string;
  _id?: string;
  name: string;
  email?: string;
  phone?: string;
  type?: 'INDIVIDUAL' | 'COMPANY';
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;

  siret?: string;
  vatNumber?: string;
  contactPerson?: string;
}

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

  async create(data: any) {
    const workspaceId =
      data.workspaceId ??
      localStorage.getItem("current_workspace_id");

    if (!workspaceId) {
      throw new Error("Aucun workspace sélectionné");
    }

    return API.post("/api/clients", {
      ...data,
      workspaceId,
    });
  },

  async update(id: string, data: any) {
    return API.put(`/api/clients/${id}`, data);
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


