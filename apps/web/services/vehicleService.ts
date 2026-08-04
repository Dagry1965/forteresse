import { API } from '@/lib/api';

export interface Vehicle {
  id: string;
  _id?: string;

  registration: string;
  brand: string;
  model: string;
  status?: string;

  clientId?: string;
  client_id?: string;

  fleet_number?: string | null;
  vin?: string | null;
  year?: number | null;
  mileage?: number | null;
  usual_driver?: string | null;
  cost_center?: string | null;
  service_name?: string | null;

  client?: {
    id: string;
    name: string;
    company_name?: string | null;
  };

  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export type VehicleInput = Partial<VehiclePayload> & {
  client_id?: string;
  plateNumber?: string;
  make?: string;
};

export interface VehiclePayload {
  clientId: string;
  registration: string;
  brand: string;
  model: string;
  status?: string;
  fleet_number?: string;
  vin?: string;
  year?: number | string;
  mileage?: number | string;
  usual_driver?: string;
  cost_center?: string;
  service_name?: string;
}

function normalizePayload(
  data: VehicleInput,
) {
  const payload: Record<string, string | number | undefined> = {
    clientId:
      data.clientId ??
      data.client_id ??
      '',
    registration:
      data.registration ??
      data.plateNumber ??
      '',
    brand:
      data.brand ??
      data.make ??
      '',
    model: data.model ?? '',
  };

  const optionalTextFields = [
    'status',
    'fleet_number',
    'vin',
    'usual_driver',
    'cost_center',
    'service_name',
  ] as const;

  for (const field of optionalTextFields) {
    const value = data[field];

    if (value !== undefined) {
      payload[field] =
        typeof value === 'string'
          ? value.trim()
          : value;
    }
  }

  if (
    data.year !== undefined &&
    data.year !== null &&
    data.year !== ''
  ) {
    payload.year = Number(data.year);
  }

  if (
    data.mileage !== undefined &&
    data.mileage !== null &&
    data.mileage !== ''
  ) {
    payload.mileage = Number(data.mileage);
  }

  return payload;
}

export const vehicleService = {
  async getAll(workspaceId?: string): Promise<Vehicle[]> {
    const effectiveWorkspaceId =
      workspaceId ??
      localStorage.getItem('current_workspace_id');

    const params = effectiveWorkspaceId
      ? `?workspaceId=${encodeURIComponent(effectiveWorkspaceId)}`
      : '';

    return API.get<Vehicle[]>(`/api/vehicles${params}`);
  },

  async getByClient(
    clientId: string,
    workspaceId?: string,
  ): Promise<Vehicle[]> {
    const effectiveWorkspaceId =
      workspaceId ??
      localStorage.getItem('current_workspace_id');

    const query = new URLSearchParams({
      clientId,
    });

    if (effectiveWorkspaceId) {
      query.set('workspaceId', effectiveWorkspaceId);
    }

    return API.get<Vehicle[]>(
      `/api/vehicles?${query.toString()}`,
    );
  },

  async getOne(id: string): Promise<Vehicle> {
    return API.get<Vehicle>(`/api/vehicles/${id}`);
  },

  async create(
    data: VehicleInput,
  ): Promise<Vehicle> {
    const workspaceId =
      localStorage.getItem('current_workspace_id');

    if (!workspaceId) {
      throw new Error(
        'Aucun workspace s?lectionn?',
      );
    }

    return API.post<Vehicle>('/api/vehicles', {
      ...normalizePayload(data),
      workspaceId,
    });
  },

  async update(
    id: string,
    data: VehicleInput,
  ): Promise<Vehicle> {
    return API.patch<Vehicle>(
      `/api/vehicles/${id}`,
      normalizePayload(data),
    );
  },

  async delete(id: string) {
    return API.patch(
      `/api/vehicles/${id}/soft-delete`,
    );
  },

  async restore(id: string) {
    return API.patch(
      `/api/vehicles/${id}/restore`,
    );
  },

  async hardDelete(id: string) {
    return API.delete(
      `/api/vehicles/${id}/hard`,
    );
  },
};
