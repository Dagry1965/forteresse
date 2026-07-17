'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { purchaseService, PurchaseOrder } from '@/services/purchaseService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { PackageCheck, ArrowLeft, Loader2 } from 'lucide-react';

export default function ReceiveOrderPage() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>({});
  const [blReference, setBlReference] = useState('');

  useEffect(() => {
    if (id) {
      purchaseService.getOrder(id as string)
        .then(res => {
          const data = res;
          setOrder(data);
          
          const qtys: Record<string, number> = {};
          if (data.items) {
            data.items.forEach((item: any) => {
              qtys[item.item_id] = item.quantity - item.received_quantity;
            });
          }
          setReceivedQtys(qtys);
        })
        .catch(() => toast.error("Erreur chargement commande"))
        .finally(() => setLoading(false));
    }
  }, [id]);
  const handleReceive = async () => {
  if (!order) return;

  try {
    setLoading(true);
    const itemsToReceive = Object.entries(receivedQtys)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, qty]) => ({ item_id: itemId, quantity: qty }));

    if (itemsToReceive.length === 0) {
      setLoading(false);
      return toast.error("Aucune quantité saisie");
    }

    await purchaseService.createReceipt({
      purchaseOrderId: order.id,
      reference: blReference || "", 
      items: itemsToReceive
    });

    toast.success("Stock approvisionné !");
    router.push('/purchase-orders');
  } catch (e: any) {
    // 🔥 RÉCUPÉRATION DU MESSAGE PRÉCIS DU BACKEND
    const errorMessage = e.response?.data?.message || "Erreur lors de la réception";
    
    // On affiche le message détaillé dans le toast
    toast.error(errorMessage, {
      duration: 5000, // On laisse un peu plus de temps pour lire le détail
    });
    
    console.error("Erreur réception:", e);
  } finally {
    setLoading(false);
  }
};


  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>;
  if (!order) return <div className="p-10 text-center">Commande introuvable</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft size={16} className="mr-2"/> Retour
        </Button>
        <h1 className="text-2xl font-black uppercase">Réception #{order.reference}</h1>
      </div>

      <Card className="p-6 border-blue-100 bg-blue-50/30 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fournisseur</p>
            <p className="font-black text-lg">{order.supplier?.name || '---'}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">N° Bon de Livraison (BL)</p>
            <input 
              className="w-full mt-1 border border-blue-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold" 
              placeholder="Ex: BL-54822"
              value={blReference}
              onChange={(e) => setBlReference(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left p-4">Article</th>
              <th className="text-center p-4">Commandé</th>
              <th className="text-center p-4 text-slate-400">Déjà reçu</th>
              <th className="text-right p-4 w-32 text-blue-600">Qté Reçue</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((line) => (
              <tr key={line.id} className="border-b last:border-0">
                <td className="p-4 font-bold text-slate-700">{line.item?.name}</td>
                <td className="p-4 text-center font-medium">{line.quantity}</td>
                <td className="p-4 text-center text-slate-400">{line.received_quantity}</td>
                <td className="p-4 text-right">
                  <input 
                    type="number"
                    min="0"
                    className="w-20 border border-blue-200 rounded px-2 py-1 text-right font-black text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={receivedQtys[line.item_id] || 0}
                    onChange={(e) => setReceivedQtys({...receivedQtys, [line.item_id]: parseInt(e.target.value) || 0})}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleReceive} 
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white h-12 px-10 font-bold flex gap-2 shadow-lg"
        >
          <PackageCheck size={20} /> Valider l'entrée en stock
        </Button>
      </div>
    </div>
  );
}
