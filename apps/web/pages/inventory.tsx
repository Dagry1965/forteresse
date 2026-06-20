import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";

const WORKSPACE_ID = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971";

export default function InventoryPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulaire Produit
  const [prodRef, setProdRef] = useState("");
  const [prodName, setProdName] = useState("");
  const [pPrice, setPPrice] = useState(0);
  const [sPrice, setSPrice] = useState(0);
  const [minStockAlert, setMinStockAlert] = useState(5);
  const [selectedSupplier, setSelectedSupplier] = useState("");

  const loadInventory = async () => {
    try {
      const [resProducts, resSuppliers] = await Promise.all([
        apiFetch(`/inventory/products?workspaceId=${WORKSPACE_ID}`),
        apiFetch(`/api/inventory/supplier?workspaceId=${WORKSPACE_ID}`),
      ]);

      const dataProducts = await resProducts.json();
      setProducts(Array.isArray(dataProducts) ? dataProducts : []);

      if (resSuppliers.ok) {
        const dataSuppliers = await resSuppliers.json();
        setSuppliers(Array.isArray(dataSuppliers) ? dataSuppliers : []);
      } else {
        setSuppliers([]);
      }
    } catch (err) {
      console.error("Erreur stock", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadInventory();
  }, [token]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch("/inventory/product", {
      method: "POST",
      body: JSON.stringify({
        reference: prodRef,
        name: prodName,
        purchase_price: Number(pPrice),
        selling_price: Number(sPrice),
        min_stock_alert: Number(minStockAlert),
        supplierId: selectedSupplier || null,
        workspaceId: WORKSPACE_ID,
      }),
    });

    if (res.ok) {
      alert("✅ Produit ajouté au catalogue !");
      setProdRef("");
      setProdName("");
      setPPrice(0);
      setSPrice(0);
      setMinStockAlert(5);
      setSelectedSupplier("");
      loadInventory();
    } else {
      alert("Erreur lors de la création du produit");
    }
  };

  const handleQuickAddStock = async (productId: string) => {
    try {
      const res = await apiFetch("/inventory/movement", {
        method: "POST",
        body: JSON.stringify({
          workspaceId: WORKSPACE_ID,
          product_id: productId,
          type: "purchase_in",
          quantity: 10,
          reason: "Réapprovisionnement rapide (Test)",
        }),
      });

      if (res.ok) {
        alert("✅ Stock mis à jour : +10 unités");
        loadInventory();
      } else {
        alert("Erreur lors de la mise à jour du stock");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!token) {
    return (
      <p className="p-6 text-slate-600">Veuillez vous connecter...</p>
    );
  }

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto font-sans">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">
        📦 Catalogue & Gestion de Stock
      </h1>

      <div className="grid gap-6 md:grid-cols-[1.1fr,2fr]">
        {/* FORMULAIRE */}
        <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            ➕ Ajouter une pièce
          </h3>
          <form onSubmit={handleCreateProduct}>
            <label className="block mb-1 text-sm font-medium text-slate-700">
              Référence
            </label>
            <input
              className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={prodRef}
              onChange={(e) => setProdRef(e.target.value)}
              required
            />

            <label className="block mb-1 text-sm font-medium text-slate-700">
              Désignation
            </label>
            <input
              className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={prodName}
              onChange={(e) => setProdName(e.target.value)}
              required
            />

            <label className="block mb-1 text-sm font-medium text-slate-700">
              Fournisseur
            </label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">— Aucun (optionnel) —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block mb-1 text-sm font-medium text-slate-700">
                  Prix Achat (€)
                </label>
                <input
                  type="number"
                  className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={pPrice}
                  onChange={(e) => setPPrice(Number(e.target.value))}
                />
              </div>
              <div className="flex-1">
                <label className="block mb-1 text-sm font-medium text-slate-700">
                  Prix Vente (€)
                </label>
                <input
                  type="number"
                  className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={sPrice}
                  onChange={(e) => setSPrice(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block mb-1 text-sm font-medium text-slate-700">
                  Seuil d’alerte stock
                </label>
                <input
                  type="number"
                  min={0}
                  className="mb-5 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={minStockAlert}
                  onChange={(e) =>
                    setMinStockAlert(Number(e.target.value))
                  }
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full font-bold"
            >
              Ajouter au Catalogue
            </Button>
          </form>
        </section>

        {/* LISTE */}
        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-3">
            📋 État du Stock actuel
          </h3>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {loading ? (
              <p className="py-8 text-center text-slate-500">
                Chargement du stock...
              </p>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left">Réf</th>
                    <th className="px-4 py-3 text-left">Désignation</th>
                    <th className="px-4 py-3 text-center">Stock</th>
                    <th className="px-4 py-3 text-left">Prix Vente</th>
                    <th className="px-4 py-3 text-center">Action rapide</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-6 text-center text-slate-500"
                      >
                        Aucun produit trouvé.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b last:border-none border-slate-100"
                      >
                        <td className="px-4 py-3">{p.reference}</td>
                        <td className="px-4 py-3">{p.name}</td>
                        <td className="px-4 py-3 text-center font-semibold">
                          <span
                            className={
                              p.inventory?.quantity > 0
                                ? "text-emerald-600"
                                : "text-red-500"
                            }
                          >
                            {p.inventory?.quantity || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {p.selling_price.toFixed(2)} €
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="success"
                            onClick={() => handleQuickAddStock(p.id)}
                            className="px-3 py-1.5 text-xs"
                          >
                            ➕ Entrée +10
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
