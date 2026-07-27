'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { API } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Printer, Download, Send, Truck, XCircle, Loader2 } from 'lucide-react';
import { PURCHASE_ORDER_STATUS } from '../../../../../shared/constants/status.constants';

export default function PurchaseOrderDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        // ✅ Correction URL : On utilise la route consolidée /inventory
        const data = await API.get(`/api/purchase-orders/${id}`)
;
        setOrder(data);
      } catch (error) {
        toast.error("Impossible de charger le bon de commande");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  // ✅ ACTION : Changer le statut (DRAFT -> SENT ou CANCELLED)
  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setActionLoading(true);
      await API.patch(`/api/inventory/orders/${order.id}/status`, { status: newStatus });
      toast.success(`Commande passée en : ${newStatus}`);
      // Rechargement des données
      const updated = await API.get(`/api/purchase-orders/${id}`)
;
      setOrder(updated);
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-20 text-center flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-slate-500 font-medium">Chargement du bon de commande...</p>
    </div>;
  }

  if (!order) {
    return <div className="p-10 text-center text-red-600 font-bold">Bon de commande introuvable</div>;
  }

  // Calcul du total HT (si non présent dans l'objet order)
  const totalHT = order.items?.reduce((acc: number, item: any) => acc + (item.quantity * item.price_buy), 0) || 0;

  return (
    <div className="max-w-5xl mx-auto p-6 print:p-0">
      {/* En-tête visible uniquement à l'écran */}
      <div className="flex justify-between items-center mb-8 print:hidden">
        <Button variant="outline" onClick={() => router.push('/purchase-orders')}>
          <ArrowLeft size={18} className="mr-2" /> Retour
        </Button>

        <div className="flex gap-3">
          {/* ✅ BOUTON : Envoyer au fournisseur (si DRAFT) */}
          {order.status === PURCHASE_ORDER_STATUS.DRAFT && (
            <Button onClick={() => handleUpdateStatus(PURCHASE_ORDER_STATUS.SENT)} disabled={actionLoading} className="bg-blue-600 text-white font-bold">
              <Send size={18} className="mr-2" /> Confirmer & Envoyer
            </Button>
          )}

          {(order.status === PURCHASE_ORDER_STATUS.SENT || order.status === PURCHASE_ORDER_STATUS.PARTIALLY_RECEIVED) && (
            <Button
              onClick={() => router.push(`/inventory/purchases/receive/${order.id}`)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold"
            >
              <Truck size={18} className="mr-2" /> Réceptionner
            </Button>
          )}


          <Button variant="outline" onClick={handlePrint}>
            <Printer size={18} className="mr-2" /> Imprimer
          </Button>

          {order.status !== PURCHASE_ORDER_STATUS.RECEIVED && order.status !== PURCHASE_ORDER_STATUS.CANCELLED && (
            <Button variant="ghost" onClick={() => handleUpdateStatus(PURCHASE_ORDER_STATUS.CANCELLED)} className="text-red-600">
              <XCircle size={18} />
            </Button>
          )}
        </div>
      </div>

      {/* Document du Bon de Commande */}
      <div className="bg-white border border-slate-200 shadow-sm p-10 print:shadow-none rounded-lg">
        <div className="flex justify-between items-start mb-10 border-b pb-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter">BON DE COMMANDE</h1>
            <p className="text-slate-500 mt-1 font-mono">RÉF : {order.reference}</p>
          </div>
          <div className="text-right">
            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
              order.status === PURCHASE_ORDER_STATUS.SENT ? 'bg-blue-100 text-blue-700' :
              order.status === PURCHASE_ORDER_STATUS.RECEIVED ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {order.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <h3 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-2">Fournisseur</h3>
            <p className="font-black text-xl text-slate-900">{order.supplier?.name}</p>
            <p className="text-slate-500 text-sm">{order.supplier?.email || 'Pas d\'email'}</p>
          </div>
          <div className="text-right">
            <h3 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-2">Date d'émission</h3>
            <p className="font-bold">{new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <table className="w-full border-collapse mb-10">
          <thead>
            <tr className="border-b bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500">
              <th className="text-left py-4 px-4 font-bold">Désignation de l'article</th>
              <th className="text-center py-4 px-4 font-bold">Qté</th>
              <th className="text-right py-4 px-4 font-bold">Prix Unitaire HT</th>
              <th className="text-right py-4 px-4 font-bold">Sous-total HT</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item: any, index: number) => (
              <tr key={index} className="border-b hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-4">
                  <p className="font-bold text-slate-900">{item.item?.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{item.item?.reference}</p>
                </td>
                <td className="py-4 px-4 text-center font-medium">{item.quantity}</td>
                <td className="py-4 px-4 text-right font-medium">{item.price_buy.toLocaleString()} €</td>
                <td className="py-4 px-4 text-right font-black text-slate-900">
                  {(item.quantity * item.price_buy).toLocaleString()} €
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end border-t-2 border-slate-900 pt-6">
          <div className="text-right space-y-1">
            <p className="text-slate-500 text-xs font-bold uppercase">Montant Total de la commande</p>
            <p className="text-4xl font-black tracking-tighter text-slate-900">
              {totalHT.toLocaleString()} € <span className="text-lg">HT</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
