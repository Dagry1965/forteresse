import { API } from '../lib/api';
import { PurchaseOrderStatus } from '../../../shared/constants/status.constants';

// ====================== INTERFACES (Typage) ======================

export interface PurchaseOrderItem {
  id: string;
  item_id: string;
  quantity: number;
  received_quantity: number;
  price_buy: number;
  item?: {
    name: string;
    reference: string;
  };
}

export interface PurchaseOrder {
  id: string;
  reference: string;
  status: PurchaseOrderStatus;
  created_at: string;
  supplier_id: string;
  supplier?: {
    name: string;
    email?: string | null;
  };
  items: PurchaseOrderItem[];
}

// ====================== SERVICE ======================

export const purchaseService = {
  /**
   * Alias pour compatibilité
   */
  async getAll() {
    return this.getAllOrders();
  },

  /**
   * Lister toutes les commandes fournisseur
   * ✔ Route backend : GET /api/purchase-orders
   */
  async getAllOrders() {
    return await API.get<PurchaseOrder[]>('/api/purchase-orders');
  },

  /**
   * Récupérer le détail d'une commande
   * ✔ Route backend : GET /api/purchase-orders/:id
   */
  async getOrder(id: string) {
    return await API.get<PurchaseOrder>(`/api/purchase-orders/${id}`);
  },

  /**
   * Créer un nouveau bon de commande
   * ✔ Route backend : POST /api/purchase-orders
   */
  async createOrder(data: {
    supplierId: string;
    reference: string;
    items: { itemId: string; quantity: number; price_buy: number }[];
  }) {
    return await API.post<PurchaseOrder>('/api/purchase-orders', data);
  },

  /**
   * Enregistrer une réception de marchandise
   * ✔ Route backend : POST /api/inventory/receipts
   */
  async createReceipt(data: {
    purchaseOrderId: string;
    reference: string;
    items: { item_id: string; quantity: number }[];
  }) {
    return await API.post('/api/inventory/receipts', data);
  },

  /**
   * Changer le statut d'une commande
   * ✔ Route backend : PATCH /api/purchase-orders/:id/status
   */
  async updateStatus(id: string, status: string) {
    return await API.patch(`/api/purchase-orders/${id}/status`, { status });
  },
};
