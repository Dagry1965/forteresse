import { API } from '@/lib/api';

export interface FinanceInvoice {
  id: string;
  status?: string;
  total?: number;
  total_paid?: number;
  created_at?: string;
}

export interface PaymentReminder {
  id: string;
  due_date?: string;
  status?: string;
  amount?: number;
}

export interface FleetPendingItem {
  id: string;
  appointment_id?: string;
  amount?: number;
}

export interface CreatePaymentPayload {
  invoice_id?: string;
  amount: number;
  method: string;
  user_id?: string;
}

export const financeService = {
  async getUnpaidInvoices(workspaceId?: string) {
    const params = workspaceId
      ? `?workspaceId=${encodeURIComponent(workspaceId)}`
      : '';

    return API.get<FinanceInvoice[]>(`/api/invoices/unpaid${params}`);
  },

  async createPayment(data: CreatePaymentPayload) {
    return API.post('/api/finance/payments', data);
  },

  async getOverdueReminders(workspaceId?: string) {
    const params = workspaceId
      ? `?workspaceId=${encodeURIComponent(workspaceId)}`
      : '';

    return API.get<PaymentReminder[]>(
      `/api/finance/payments/reminders${params}`,
    );
  },

  async recordPayment(data: {
    schedule_id: string;
    method: string;
  }) {
    return API.post(
      '/api/finance/payments/record',
      data,
    );
  },

  async getPendingFleetItems(clientId: string) {
    return API.get<FleetPendingItem[]>(
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

    return API.get<{
      turnover?: Array<{ name: string; total: number }>;
    }>(
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

  async payInvoice(
    invoiceId: string,
    data: {
      amount: number;
      method: string;
      user_id?: string;
    },
  ) {
    return API.post(
      `/api/finance/invoice/${invoiceId}/pay`,
      data,
    );
  },

  async getAllInvoices(workspaceId?: string) {
    const params = workspaceId
      ? `?workspaceId=${encodeURIComponent(workspaceId)}`
      : '';

    return API.get<FinanceInvoice[]>(
      `/api/invoices${params}`,
    );
  },
};
