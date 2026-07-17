import { API } from '@/lib/api';

// Définition de l'interface pour un produit en stock
export interface StockItem {
  id: string;
  name: string;
  reference?: string;
  price_sell: number;
  quantity: number;
}

export const stockService = {
  /**
   * Récupérer tous les produits de l'inventaire
   */
  getAll: async (workspaceId?: string) => {
    const params = workspaceId ? `?workspaceId=${workspaceId}` : '';
    // Utilisation du chemin relatif géré par ton instance API
    return await API.get<StockItem[]>(`/api/inventory/products${params}`);
  },

  /**
   * Récupérer un produit spécifique
   */
  getOne: async (id: string) => {
    return await API.get<StockItem>(`/api/inventory/products/${id}`);
  }
};
