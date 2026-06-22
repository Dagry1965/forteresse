import React, { useEffect, useState } from "react";
import { EmptyState } from '../components/ui/empty-state';
import { Tabs } from '../components/ui/tabs';
import { Alert } from '../components/ui/alert';
import { TextareaField } from '../components/ui/textarea-field';
import { SelectField } from '../components/ui/select-field';
import { ResponsiveGrid } from '../components/ui/responsive-grid';
import { DataTable } from '../components/ui/data-table';
import { DateField } from '../components/ui/date-field';
import { TextField } from '../components/ui/text-field';
import { apiFetch } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import Section from "../components/section";

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
      console.error("erreur stock", err);
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
      alert("ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ produit ajoutÃƒÆ’Ã‚Â© au catalogue !");
      setProdRef("");
      setProdName("");
      setPPrice(0);
      setSPrice(0);
      setMinStockAlert(5);
      setSelectedSupplier("");
      loadInventory();
    } else {
      alert("erreur lors de la crÃƒÆ’Ã‚Â©ation du produit");
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
          reason: "rÃƒÆ’Ã‚Â©approvisionnement rapide (test)",
        }),
      });

      if (res.ok) {
        alert("ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ stock mis ÃƒÆ’Ã‚Â  jour : +10 unitÃƒÆ’Ã‚Â©s");
        loadInventory();
      } else {
        alert("erreur lors de la mise ÃƒÆ’Ã‚Â  jour du stock");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!token) return null;

  return (
    <div className="flex flex-col gap-10 p-10 bg-[oklch(0.98_0_0)] min-h-screen font-sans text-[oklch(0.22_0_0)]">
      
      {/* HEADER PREMIUM */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tighter lowercase">
          stock & catalogue
        </h1>
        <p className="text-[oklch(0.45_0_0)] font-medium text-sm">
          gestion des piÃƒÆ’Ã‚Â¨ces dÃƒÆ’Ã‚Â©tachÃƒÆ’Ã‚Â©es et inventaire en temps rÃƒÆ’Ã‚Â©el
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 items-start">
        {/* COLONNE GAUCHE : FORMULAIRE */}
        <div className="xl:col-span-1">
          <Section title="ajouter une piÃƒÆ’Ã‚Â¨ce">
            <form onSubmit={handleCreateProduct} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase text-[oklch(0.45_0_0)] ml-1 tracking-widest">rÃƒÆ’Ã‚Â©fÃƒÆ’Ã‚Â©rence</span>
                <input
                  value={prodRef}
                  onChange={(e) => setProdRef(e.target.value)}
                  required
                  className="w-full bg-[oklch(0.98_0_0)] border border-[oklch(0.92_0_0)] rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-[oklch(0.45_0_0)] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase text-[oklch(0.45_0_0)] ml-1 tracking-widest">dÃƒÆ’Ã‚Â©signation</span>
                <input
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  required
                  className="w-full bg-[oklch(0.98_0_0)] border border-[oklch(0.92_0_0)] rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-[oklch(0.45_0_0)] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase text-[oklch(0.45_0_0)] ml-1 tracking-widest">fournisseur</span>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full bg-[oklch(0.98_0_0)] border border-[oklch(0.92_0_0)] rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-[oklch(0.45_0_0)] transition-colors text-[oklch(0.22_0_0)]"
                >
                  <option value="">ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â aucun (optionnel) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase text-[oklch(0.45_0_0)] ml-1 tracking-widest">prix achat</span>
                  <input
                    type="number"
                    value={pPrice}
                    onChange={(e) => setPPrice(Number(e.target.value))}
                    className="w-full bg-[oklch(0.98_0_0)] border border-[oklch(0.92_0_0)] rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-[oklch(0.45_0_0)] transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase text-[oklch(0.45_0_0)] ml-1 tracking-widest">prix vente</span>
                  <input
                    type="number"
                    value={sPrice}
                    onChange={(e) => setSPrice(Number(e.target.value))}
                    className="w-full bg-[oklch(0.98_0_0)] border border-[oklch(0.92_0_0)] rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-[oklch(0.45_0_0)] transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase text-[oklch(0.45_0_0)] ml-1 tracking-widest">seuil d'alerte</span>
                <input
                  type="number"
                  min={0}
                  value={minStockAlert}
                  onChange={(e) => setMinStockAlert(Number(e.target.value))}
                  className="w-full bg-[oklch(0.98_0_0)] border border-[oklch(0.92_0_0)] rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-[oklch(0.45_0_0)] transition-colors"
                />
              </div>

              <Button type="submit" className="w-full rounded-2xl py-6 font-bold tracking-widest uppercase text-[10px]">
                ajouter au catalogue
              </Button>
            </form>
          </Section>
        </div>

        {/* COLONNE DROITE : LISTE */}
        <div className="xl:col-span-2">
          <Section title="ÃƒÆ’Ã‚Â©tat du stock actuel">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left border-b border-[oklch(0.92_0_0)]">
                    <th className="pb-4 font-bold text-[oklch(0.45_0_0)] lowercase">rÃƒÆ’Ã‚Â©f</th>
                    <th className="pb-4 font-bold text-[oklch(0.45_0_0)] lowercase">dÃƒÆ’Ã‚Â©signation</th>
                    <th className="pb-4 font-bold text-[oklch(0.45_0_0)] lowercase text-center">stock</th>
                    <th className="pb-4 font-bold text-[oklch(0.45_0_0)] lowercase">prix vente</th>
                    <th className="pb-4 font-bold text-[oklch(0.45_0_0)] lowercase text-right">action rapide</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[oklch(0.96_0_0)]">
                  {loading ? (
                    <tr><td colSpan={5} className="py-10 text-center animate-pulse text-[oklch(0.45_0_0)] lowercase">chargement du stock...</td></tr>
                  ) : products.length === 0 ? (
                    <tr><td colSpan={5} className="py-10 text-center text-[oklch(0.45_0_0)] lowercase italic">aucun produit en inventaire.</td></tr>
                  ) : (
                    products.map((p) => (
                      <tr key={p.id} className="group hover:bg-[oklch(0.99_0_0)] transition-colors">
                        <td className="py-5 font-mono text-xs uppercase tracking-tight text-[oklch(0.45_0_0)]">
                          {p.reference}
                        </td>
                        <td className="py-5 font-bold text-[oklch(0.22_0_0)] lowercase">
                          {p.name}
                        </td>
                        <td className="py-5 text-center">
                          <span className={`font-bold px-3 py-1 rounded-full text-xs ${p.inventory?.quantity > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {p.inventory?.quantity || 0}
                          </span>
                        </td>
                        <td className="py-5 font-medium text-[oklch(0.35_0_0)]">
                          {p.selling_price.toFixed(2)}.-
                        </td>
                        <td className="py-5 text-right">
                          <button
                            onClick={() => handleQuickAddStock(p.id)}
                            className="bg-[oklch(0.96_0_0)] hover:bg-[oklch(0.22_0_0)] hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all"
                          >
                            entrÃƒÆ’Ã‚Â©e +10
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}






