'use client';

import React, { useEffect, useState } from 'react';
import { stockService } from '@/services/stockService';
import { Button } from '../components/ui/button';
import Section from '../components/section';
import { Card } from '../components/ui/card';

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const loadInventory = async () => {
    try {
      setLoading(true);

      const res = await stockService.getAll();

      // 🔥 Normalisation ultra-sécurisée
      const list = res ?? [];

      setProducts(list);
      setFilteredProducts(list);
    } catch (error) {
      console.error("Erreur chargement inventaire", error);
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  // Recherche en temps réel — toujours sur un tableau
  useEffect(() => {
    const filtered = products.filter((product) =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.reference?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  if (loading) {
    return <div className="p-10">Chargement de l'inventaire...</div>;
  }

  return (
    <div className="p-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight lowercase">Inventaire</h1>
          <p className="text-[oklch(0.45_0_0)]">Gestion des stocks et mouvements</p>
        </div>
        <Button onClick={() => alert("Fonctionnalité à venir : Ajuster le stock")}>
          Ajuster le stock
        </Button>
      </div>

      {/* Recherche */}
      <div className="mb-6 max-w-md">
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-[oklch(0.92_0_0)] rounded-2xl px-5 py-3 text-sm focus:outline-none"
        />
      </div>

      {filteredProducts.length === 0 ? (
        <Card className="p-20 text-center">
          <p className="text-[oklch(0.45_0_0)]">Aucun produit trouvé.</p>
        </Card>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-[oklch(0.98_0_0)]">
                <th className="px-6 py-4 text-left font-bold text-[oklch(0.45_0_0)]">Produit</th>
                <th className="px-6 py-4 text-left font-bold text-[oklch(0.45_0_0)]">Référence</th>
                <th className="px-6 py-4 text-right font-bold text-[oklch(0.45_0_0)]">Prix de vente</th>
                <th className="px-6 py-4 text-center font-bold text-[oklch(0.45_0_0)]">Stock actuel</th>
                <th className="px-6 py-4 text-center font-bold text-[oklch(0.45_0_0)]">Statut</th>
                <th className="px-6 py-4 text-center font-bold text-[oklch(0.45_0_0)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const quantity = product.inventory?.quantity || 0;
                const isLow = quantity < 5;
                const isOut = quantity === 0;

                return (
                  <tr key={product.id} className="border-b hover:bg-[oklch(0.99_0_0)]">
                    <td className="px-6 py-5 font-medium">{product.name}</td>
                    <td className="px-6 py-5 text-[oklch(0.45_0_0)] font-mono text-sm">
                      {product.reference || '—'}
                    </td>
                    <td className="px-6 py-5 text-right font-bold">
                      {product.selling_price} €
                    </td>
                    <td className="px-6 py-5 text-center font-bold text-lg">
                      {quantity}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-4 py-1 rounded-full text-xs font-bold ${
                        isOut 
                          ? 'bg-red-100 text-red-700' 
                          : isLow 
                            ? 'bg-orange-100 text-orange-700' 
                            : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {isOut ? 'Rupture' : isLow ? 'Stock faible' : 'OK'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex justify-center gap-2">
                        <Button size="sm" variant="outline">Mouvements</Button>
                        <Button size="sm" variant="outline">Ajuster</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

