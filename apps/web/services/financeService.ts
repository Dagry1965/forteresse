import { API } from '@/lib/api';

export const financeService = {
  async getUnpaidInvoices(workspaceId?: string) {
    const params = workspaceId
      ? `?workspaceId=${encodeURIComponent(workspaceId)}`
      : '';

    return API.get<any[]>(`/api/invoices/unpaid${params}`);
  },

  async createPayment(data: any) {
    return API.post('/api/finance/payments', data);
  },

  async getOverdueReminders(workspaceId?: string) {
    const params = workspaceId
      ? `?workspaceId=${encodeURIComponent(workspaceId)}`
      : '';

    return API.get<any[]>(
      `/api/finance/payments/reminders${params}`,
    );
  },

  async recordPayment(data: {
    schedule_id: string;
    method: string;
    user_id?: string;
  }) {
    return API.post(
      '/api/finance/payments/record',
      data,
    );
  },

  async getPendingFleetItems(clientId: string) {
    return API.get<any[]>(
      `/api/finance/fleet/pending/${clientId}`,
    );
  },

  async createGroupedInvoice(data: {
    client_id: string;
    appointment_ids: string[];
  }) {
    return API.post('/api/invoices/fleet', data);
  },

  async getDailyReport(
    date?: string,
    workspaceId?: string,
  ) {
    const params = new URLSearchParams();

    if (date) {
      params.set('date', date);
    }

    if (workspaceId) {
      params.set('workspaceId', workspaceId);
    }

    const query = params.toString();

    return API.get(
      `/api/finance/cashier/report${query ? `?${query}` : ''}`,
    );
  },

  async getStats(workspaceId?: string) {
    const params = workspaceId
      ? `?workspaceId=${encodeURIComponent(workspaceId)}`
      : '';

    return API.get(
      `/api/finance/reports/dashboard-stats${params}`,
    );
  },

  async getInvoiceById(
    id: string,
    workspaceId?: string,
  ) {
    const params = workspaceId
      ? `?workspaceId=${encodeURIComponent(workspaceId)}`
      : '';

    return API.get(
      `/api/invoices/${id}${params}`,
    );
  },

  async getAllInvoices(workspaceId?: string) {
    const params = workspaceId
      ? `?workspaceId=${encodeURIComponent(workspaceId)}`
      : '';

    return API.get<any[]>(
      `/api/invoices${params}`,
    );
  },
};
