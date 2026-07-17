import { API } from '@/lib/api';

export interface Vehicle {
  id: string;
  _id?: string;

  make?: string;
  brand?: string;
  model: string;

  plateNumber?: string;
  registration?: string;

  clientId?: string;
  client_id?: string;

  client?: {
    id: string;
    name: string;
  };

  deleted_at?: string | null;
}

export const vehicleService = {
  async getAll(workspaceId?: string) {
    try {
      const params = workspaceId ? `?workspaceId=${workspaceId}` : '';
      return await API.get<Vehicle[]>(`/api/vehicles${params}`);
    } catch (error: any) {
      console.error('[vehicleService] Erreur getAll:', error);
      throw error;
    }
  },

  async getByClient(clientId: string, workspaceId?: string) {
    try {
      const params = workspaceId
        ? `?clientId=${clientId}&workspaceId=${workspaceId}`
        : `?clientId=${clientId}`;

      return await API.get<Vehicle[]>(`/api/vehicles${params}`);
    } catch (error: any) {
      console.error('[vehicleService] Erreur getByClient:', error);
      throw error;
    }
  },

  async getOne(id: string) {
    try {
      return await API.get<Vehicle>(`/api/vehicles/${id}`);
    } catch (error: any) {
      console.error('[vehicleService] Erreur getOne:', error);
      throw error;
    }
  },

  async create(data: Partial<Vehicle>) {
    try {
      return await API.post<Vehicle>('/api/vehicles', data);
    } catch (error: any) {
      console.error('[vehicleService] Erreur création:', error);
      throw error;
    }
  },

  async update(id: string, data: Partial<Vehicle>) {
    try {
      return await API.patch<Vehicle>(`/api/vehicles/${id}`, data);
    } catch (error: any) {
      console.error('[vehicleService] Erreur mise à jour:', error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      return await API.patch(`/api/vehicles/${id}/soft-delete`);
    } catch (error: any) {
      console.error('[vehicleService] Erreur soft delete:', error);
      throw error;
    }
  },

  async restore(id: string) {
    try {
      return await API.patch(`/api/vehicles/${id}/restore`);
    } catch (error: any) {
      console.error('[vehicleService] Erreur restore:', error);
      throw error;
    }
  },

  async hardDelete(id: string) {
    try {
      return await API.delete(`/api/vehicles/${id}/hard`);
    } catch (error: any) {
      console.error('[vehicleService] Erreur hard delete:', error);
      throw error;
    }
  },
};
