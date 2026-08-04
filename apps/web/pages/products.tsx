'use client';

import React, { useEffect, useState } from 'react';
import { stockService } from '@/services/stockService';
import { Button } from '../components/ui/button';
import Section from '../components/section';
import { Card } from '../components/ui/card';
import { normalizeList } from '@/utils/normalize';

type Product = {
  id: string;
  name: string;
  reference?: string;
  purchase_price?: number;
  selling_price?: number;
  inventory?: {
    quantity?: number;
  };
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    try {
      setLoading(true);

      const raw = await stockService.getAll();

      // 🔥 Normalisation backend
      const list = normalizeList<Product>(raw);

      setProducts(list);
      setFilteredProducts(list);
    } catch (error) {
      console.error("Erreur lors du chargement des produits", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Filtre en temps réel
  useEffect(() => {
    const base = normalizeList<Product>(products);

    const filtered = base.filter((product) =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.reference?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  if (loading) {
    return <div className="p-10">Chargement du catalogue...</div>;
  }

  const safeFiltered = normalizeList<Product>(filteredProducts);

  return (
    <div className="p-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight lowercase">Catalogue Produits</h1>
          <p className="text-[oklch(0.45_0_0)]">Gestion du stock et des prix</p>
        </div>
        <Button onClick={() => alert("Fonctionnalité à venir : Ajouter un produit")}>
          + Ajouter un produit
        </Button>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher par nom ou référence..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md border border-[oklch(0.92_0_0)] rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-[oklch(0.45_0_0)]"
        />
      </div>

      {safeFiltered.length === 0 ? (
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
                <th className="px-6 py-4 text-right font-bold text-[oklch(0.45_0_0)]">Prix d'achat</th>
                <th className="px-6 py-4 text-right font-bold text-[oklch(0.45_0_0)]">Prix de vente</th>
                <th className="px-6 py-4 text-center font-bold text-[oklch(0.45_0_0)]">Stock</th>
                <th className="px-6 py-4 text-center font-bold text-[oklch(0.45_0_0)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {safeFiltered.map((product) => {
                const stock = product.inventory?.quantity || 0;
                const isLowStock = stock < 5;

                return (
                  <tr key={product.id} className="border-b hover:bg-[oklch(0.99_0_0)]">
                    <td className="px-6 py-5 font-medium">{product.name}</td>
                    <td className="px-6 py-5 text-[oklch(0.45_0_0)] font-mono text-sm">
                      {product.reference || '—'}
                    </td>
                    <td className="px-6 py-5 text-right">
                      {product.purchase_price ? `${product.purchase_price} €` : '—'}
                    </td>
                    <td className="px-6 py-5 text-right font-bold">
                      {product.selling_price} €
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span
                        className={`px-4 py-1 rounded-full text-xs font-bold ${
                          isLowStock 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {stock} unités
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex justify-center gap-2">
                        <Button size="sm" variant="outline">
                          Modifier
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50">
                          Supprimer
                        </Button>
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
