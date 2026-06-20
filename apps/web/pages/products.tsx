import React, { useEffect, useState } from "react";
import { CONFIG } from "../lib/config";

type Product = {
  id: string;
  reference: string | null;
  name: string;
  purchase_price: number;
  selling_price: number;
  min_stock_alert: number;
  inventory?: { quantity: number } | null;
  supplier?: { name: string } | null;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(
        `${CONFIG.API_BASE}/inventory/products?workspaceId=${CONFIG.WORKSPACE_ID}`,
      );
      const json = await res.json();
      setProducts(Array.isArray(json) ? json : []);
    } catch (error) {
      console.error("Erreur chargement produits:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto font-sans">
      <h1 className="text-3xl font-bold text-slate-900 mb-4">
        Catalogue Produits - Forteresse
      </h1>

      {loading && (
        <p className="text-slate-600 mb-4">Chargement...</p>
      )}

      {!loading && products.length === 0 && (
        <p className="text-slate-500">Aucun produit dans ce catalogue.</p>
      )}

      {products.length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Réf</th>
                <th className="px-4 py-3 text-left">Nom</th>
                <th className="px-4 py-3 text-left">Fournisseur</th>
                <th className="px-4 py-3 text-left">Stock</th>
                <th className="px-4 py-3 text-left">Alerte min</th>
                <th className="px-4 py-3 text-left">Prix achat</th>
                <th className="px-4 py-3 text-left">Prix vente</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="border-b last:border-none border-slate-100"
                >
                  <td className="px-4 py-2">{p.reference || "-"}</td>
                  <td className="px-4 py-2">{p.name}</td>
                  <td className="px-4 py-2">
                    {p.supplier?.name || "-"}
                  </td>
                  <td className="px-4 py-2">
                    {p.inventory?.quantity ?? 0}
                  </td>
                  <td className="px-4 py-2">
                    {p.min_stock_alert}
                  </td>
                  <td className="px-4 py-2">
                    {p.purchase_price.toFixed(2)} €
                  </td>
                  <td className="px-4 py-2">
                    {p.selling_price.toFixed(2)} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
