'use client';

import React, { useState, useEffect } from 'react';
import { API } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { useRouter } from 'next/router';

interface StockAlert {
  id: string;
  name: string;
  quantity: number;
  min_stock: number;
  unit?: string | null;
  supplier?: {
    name?: string | null;
  } | null;
}

interface AutoOrderResponse {
  id: string;
  reference: string;
}

export const StockAlerts = () => {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    API.get<StockAlert[]>('/api/inventory/alerts')
      .then((res) => setAlerts(res || []))
      .finally(() => setLoading(false));
  }, []);

  const handleQuickOrder = async (itemId: string) => {
    try {
      const { data } = await axios.post<AutoOrderResponse>(
        `http://localhost:4000/api/inventory/purchases/auto-generate`,
        { itemId },
        {
          headers: { 'x-workspace-id': 'seed-workspace-1' }
        }
      );

      alert(`Commande ${data.reference} mise à jour !`);
      router.push(`/inventory/purchases/${data.id}`);
    } catch (err) {
      alert("Erreur lors de la génération");
    }
  };

  if (loading || alerts.length === 0) return null;

  return (
    <Card className="border-red-100 bg-red-50/30 overflow-hidden">
      <div className="bg-red-500 p-3 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="animate-pulse" />
          <span className="font-bold text-sm uppercase tracking-wider">
            Alertes Stock ({alerts.length})
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-red-600 text-xs font-bold"
          onClick={() => router.push('/purchase-orders')}
        >
          Commander
        </Button>
      </div>

      <div className="p-4 space-y-3">
        {alerts.map((item) => (
          <div
            key={item.id}
            className="flex justify-between items-center bg-white p-3 rounded-lg border border-red-100 shadow-sm"
          >
            <div>
              <p className="font-bold text-slate-900 text-sm">{item.name}</p>
              <p className="text-[10px] text-slate-400 uppercase font-medium">
                Fournisseur : {item.supplier?.name || 'Non défini'}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs font-black text-red-600 uppercase">
                Rupture proche
              </p>
              <p className="text-lg font-black tracking-tighter text-slate-900">
                {item.quantity}{' '}
                <span className="text-[10px] text-slate-400">
                  / {item.min_stock} {item.unit}
                </span>
              </p>

              {/* Nouveau bouton */}
              <button
                onClick={() => handleQuickOrder(item.id)}
                className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 mt-2"
              >
                + Ajouter au brouillon
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
