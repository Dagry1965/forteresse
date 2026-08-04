'use client';

import React, { useEffect, useState } from 'react';
import { stockService } from '@/services/stockService';
import type { StockItem } from '@/services/stockService';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import Section from '../components/section';

type AlertStockItem = StockItem & {
  selling_price?: number;
  inventory?: {
    quantity?: number;
  };
};

export default function InventoryAlertsPage() {
  const [lowStockItems, setLowStockItems] = useState<AlertStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLowStock = async () => {
    try {
      setLoading(true);
      const products = await stockService.getAll();

      // Filtre les produits avec stock faible (ex: moins de 5 unités)
      const alerts = (products || []).filter(
        (product: AlertStockItem) => (product.inventory?.quantity || 0) < 5
      );

      setLowStockItems(alerts as AlertStockItem[]);
    } catch (error) {
      console.error("Erreur lors du chargement des alertes stock", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLowStock();
  }, []);

  if (loading) {
    return (
      <div className="p-10">
        <p>Chargement des alertes de stock...</p>
      </div>
    );
  }

  return (
    <div className="p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight lowercase">Alertes Stock</h1>
          <p className="text-[oklch(0.45_0_0)]">Produits en quantité faible</p>
        </div>
        <Button onClick={loadLowStock} variant="outline">
          Rafraîchir
        </Button>
      </div>

      {lowStockItems.length === 0 ? (
        <Card className="p-20 text-center">
          <p className="text-[oklch(0.45_0_0)]">Aucune alerte de stock pour le moment.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lowStockItems.map((product) => {
            const quantity = product.inventory?.quantity || 0;
            const isCritical = quantity === 0;

            return (
              <Card key={product.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{product.name}</h3>
                    <p className="text-sm text-[oklch(0.45_0_0)]">Réf: {product.reference}</p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs rounded-full font-bold ${
                      isCritical 
                        ? "bg-red-100 text-red-700" 
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {quantity} en stock
                  </span>
                </div>

                <div className="mt-6 flex justify-between items-end">
                  <div>
                    <p className="text-xs text-[oklch(0.45_0_0)]">Prix de vente</p>
                    <p className="text-xl font-bold">{product.selling_price} €</p>
                  </div>

                  <Button 
                    variant={isCritical ? "default" : "outline"} 
                    size="sm"
                    onClick={() => alert(`Commander ${product.name}`)}
                  >
                    Commander
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}