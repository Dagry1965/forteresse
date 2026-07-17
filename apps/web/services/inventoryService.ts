import { API } from '@/lib/api';

export const inventoryService = {
  async getAlerts(workspaceId?: string) {
    const params = workspaceId
      ? `?workspaceId=${encodeURIComponent(workspaceId)}`
      : '';

    return API.get<any[]>(
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

