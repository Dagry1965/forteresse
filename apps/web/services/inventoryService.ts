import { API } from '@/lib/api';

export interface InventoryAlert {
  id: string;
  name?: string;
  reference?: string;
  quantity?: number;
  threshold?: number;
}

export const inventoryService = {
  async getAlerts(workspaceId?: string) {
    const params = workspaceId
      ? `?workspaceId=${encodeURIComponent(workspaceId)}`
      : '';

    return API.get<InventoryAlert[]>(
      `/api/inventory/alerts${params}`,
    );
  },

  async getStockValue(workspaceId?: string) {
    const params = workspaceId
      ? `?workspaceId=${encodeURIComponent(workspaceId)}`
      : '';

    return API.get<{ value?: number; totalValue?: number }>(
      `/api/inventory/value${params}`,
    );
  },

  async generateAutoOrder(
    itemId: string,
    workspaceId?: string,
  ) {
    return API.post(
      '/api/inventory/purchases/auto-generate',
      {
        itemId,
        workspaceId,
      },
    );
  },
};

