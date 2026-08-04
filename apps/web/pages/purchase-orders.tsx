'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { purchaseService, PurchaseOrder } from '@/services/purchaseService';
import { PurchaseOrderForm } from '../modules/inventory/components/PurchaseOrderForm';
import { Modal } from '@/components/ui/modal'; 
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { PURCHASE_ORDER_STATUS } from '../../../shared/constants/status.constants';
import { 
  Plus, 
  Package, 
  Truck, 
  Send,
  Loader2,
  ChevronRight
} from 'lucide-react';

type PurchaseOrdersResponse = {
  data?: PurchaseOrder[];
};

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- CHARGEMENT DES DONNÉES ---
  const loadPurchaseOrders = useCallback(async () => {
    try {
      setLoading(true);

      // ✔ Route corrigée : /api/purchase-orders
      const data = await purchaseService.getAll();

      const response = data as PurchaseOrder[] | PurchaseOrdersResponse;
      const ordersList = Array.isArray(response)
        ? response
        : Array.isArray(response.data)
          ? response.data
          : [];

      setOrders(ordersList);
    } catch (error) {
      console.error("Erreur chargement commandes:", error);
      toast.error("Impossible de charger les bons de commande");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPurchaseOrders();
  }, [loadPurchaseOrders]);

  // --- ACTION : ENVOYER LA COMMANDE ---
  const handleSendOrder = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await purchaseService.updateStatus(id, PURCHASE_ORDER_STATUS.SENT);
      toast.success("Commande envoyée au fournisseur !");
      loadPurchaseOrders();
    } catch (error) {
      toast.error("Erreur lors de l'envoi");
    }
  };

  // --- BADGES DE STATUT ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case PURCHASE_ORDER_STATUS.DRAFT: return <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border border-slate-200">Brouillon</span>;
      case PURCHASE_ORDER_STATUS.SENT: return <span className="bg-blue-100 text-blue-600 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border border-blue-200">Envoyé</span>;
      case PURCHASE_ORDER_STATUS.RECEIVED: return <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border border-green-200">Reçu</span>;
      case PURCHASE_ORDER_STATUS.PARTIALLY_RECEIVED: return <span className="bg-orange-100 text-orange-600 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border border-orange-200">Partiel</span>;
      default: return <span className="bg-slate-100 px-2.5 py-1 rounded-full text-[10px] font-black uppercase">{status}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-slate-900">Achats & Fournisseurs</h1>
          <p className="text-slate-500 text-sm font-medium">Gérez vos commandes de pièces et entrées en stock</p>
        </div>
        
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-lg shadow-blue-100 flex gap-2 h-12 transition-all active:scale-95"
        >
          <Plus size={18} /> Nouvelle Commande
        </Button>
      </div>

      {/* MODALE */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Créer un bon de commande"
      >
        <div className="p-2">
          <PurchaseOrderForm onOrderCreated={() => {
            setIsModalOpen(false);
            loadPurchaseOrders();
            toast.success("Bon de commande généré !");
          }} />
        </div>
      </Modal>

      {/* LISTE DES COMMANDES */}
      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-2xl bg-white">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-blue-600" size={40} />
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Mise à jour...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <Package size={48} className="mx-auto text-slate-300" />
            <p className="text-slate-500 font-medium">Aucune commande enregistrée pour le moment.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="p-5">Référence</th>
                <th className="p-5">Fournisseur</th>
                <th className="p-5 text-center">Statut</th>
                <th className="p-5">Date Création</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr 
                  key={order.id} 
                  className="border-b last:border-0 hover:bg-slate-50/30 transition-all cursor-pointer group"
                  onClick={() => router.push(`/inventory/purchases/${order.id}`)}
                >
                  <td className="p-5 font-bold text-blue-600 group-hover:underline">
                    {order.reference}
                  </td>
                  <td className="p-5 font-bold text-slate-700">
                    {order.supplier?.name || '---'}
                  </td>
                  <td className="p-5 text-center">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="p-5 text-slate-500 text-sm font-medium uppercase">
                    {order.created_at ? new Date(order.created_at).toLocaleDateString('fr-FR') : '---'}
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex justify-end gap-3 items-center">
                      
                      {order.status === PURCHASE_ORDER_STATUS.DRAFT ? (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-blue-200 text-blue-700 hover:bg-blue-50 font-black text-[10px] uppercase h-8 px-4"
                          onClick={(e) => handleSendOrder(e, order.id)}
                        >
                          <Send size={14} className="mr-2" /> Envoyer
                        </Button>
                      ) : (order.status === PURCHASE_ORDER_STATUS.SENT || order.status === PURCHASE_ORDER_STATUS.PARTIALLY_RECEIVED) ? (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-green-200 text-green-700 hover:bg-green-50 font-black text-[10px] uppercase h-8 px-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/inventory/purchases/receive/${order.id}`);
                          }}
                        >
                          <Truck size={14} className="mr-2" /> Réceptionner
                        </Button>
                      ) : null}
                      
                      <div className="text-slate-300 group-hover:text-blue-600 transition-colors">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
