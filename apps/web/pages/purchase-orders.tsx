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

const WORKSPACE_ID = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971";

export default function PurchaseOrdersPage() {
  const { token } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [poLines, setPoLines] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const resSuppliers = await apiFetch(
        `/api/inventory/supplier?workspaceId=${WORKSPACE_ID}`,
      );
      const dataSuppliers = await safeJson(resSuppliers);
      setSuppliers(Array.isArray(dataSuppliers) ? dataSuppliers : []);

      const resProducts = await apiFetch(
        `/api/inventory/products?workspaceId=${WORKSPACE_ID}`,
      );
      const dataProducts = await safeJson(resProducts);
      setProducts(Array.isArray(dataProducts) ? dataProducts : []);

      const resPOs = await apiFetch(
        `/api/purchase-orders?workspaceId=${WORKSPACE_ID}`,
      );
      const dataPOs = await safeJson(resPOs);
      setPurchaseOrders(Array.isArray(dataPOs) ? dataPOs : []);
    } catch (err: any) {
      setError(err?.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  async function safeJson(res: Response) {
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      return null;
    }
  }

  const handleAddProductToPo = (product: any) => {
    const existing = poLines.find((line: any) => line.productId === product.id);
    if (existing) {
      setPoLines(
        poLines.map((line: any) =>
          line.productId === product.id
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        ),
      );
    } else {
      setPoLines([
        ...poLines,
        {
          productId: product.id,
          name: product.name,
          quantity: 1,
          unit_price: Number(product.purchase_price || 0),
        },
      ]);
    }
  };

  const getPayload = () => ({
    workspaceId: WORKSPACE_ID,
    supplierId: selectedSupplier,
    reference: `PO-${Date.now()}`,
    status: "draft",
    totalAmount: poLines.reduce(
      (sum, l) => sum + l.quantity * l.unit_price,
      0,
    ),
    lines: poLines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
      unit_price: l.unit_price,
    })),
  });

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload = getPayload();

    try {
      const res = await apiFetch("/api/purchase-orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert("ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Bon de Commande crÃƒÆ’Ã‚Â©ÃƒÆ’Ã‚Â© !");
        setSelectedSupplier("");
        setPoLines([]);
        loadData();
      } else {
        const body = await safeJson(res);
        setError(body?.message || "Erreur crÃƒÆ’Ã‚Â©ation");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleConfirmPo = async (poId: string) => {
    setError(null);
    try {
      const res = await apiFetch(
        `/api/purchase-orders/${poId}/confirm`,
        { method: "POST" },
      );
      if (res.ok) {
        alert("ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Bon de Commande confirmÃƒÆ’Ã‚Â© !");
        loadData();
      } else {
        const body = await safeJson(res);
        setError(body?.message || "Erreur confirmation");
      }
    } catch (err: any) {
      setError(err?.message || "Erreur confirmation");
    }
  };

  const handleReceivePo = async (poId: string) => {
    setError(null);
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) {
      setError("Bon de Commande introuvable.");
      return;
    }

    const confirmReception = window.confirm(
      `Voulez-vous vraiment rÃƒÆ’Ã‚Â©ceptionner ce bon de commande ?\n\nRÃƒÆ’Ã‚Â©fÃƒÆ’Ã‚Â©rence : ${po.reference}\nFournisseur : ${po.supplier?.name || "Inconnu"}`,
    );
    if (!confirmReception) return;

    const receptionRef = prompt(
      'Entrez la rÃƒÆ’Ã‚Â©fÃƒÆ’Ã‚Â©rence du Bon de Livraison (ex: BL-2024-001) :',
    );
    if (!receptionRef) {
      setError("RÃƒÆ’Ã‚Â©ception annulÃƒÆ’Ã‚Â©e : RÃƒÆ’Ã‚Â©fÃƒÆ’Ã‚Â©rence manquante.");
      return;
    }

    const receptionLines = po.lines.map((line: any) => ({
      productId: line.productId,
      quantity: Number(line.quantity || 0),
      unit_price: Number(line.unit_price || 0),
    }));

    try {
      const res = await apiFetch("/api/purchase-receipts", {
        method: "POST",
        body: JSON.stringify({
          purchaseOrderId: po.id,
          workspaceId: WORKSPACE_ID,
          reference: receptionRef,
          lines: receptionLines,
        }),
      });

      const body = await safeJson(res);
      if (!res.ok) {
        throw new Error(body?.message || res.statusText);
      }

      alert(`ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ RÃƒÆ’Ã‚Â©ception "${receptionRef}" enregistrÃƒÆ’Ã‚Â©e avec succÃƒÆ’Ã‚Â¨s !`);
      loadData();
    } catch (err: any) {
      console.error("Erreur rÃƒÆ’Ã‚Â©ception :", err);
      setError(err?.message || "Erreur lors de la rÃƒÆ’Ã‚Â©ception");
    }
  };

  if (!token) {
    return (
      <p className="p-6 text-slate-600">Connexion requise...</p>
    );
  }

  if (loading) {
    return (
      <p className="p-6 text-slate-600">Chargement...</p>
    );
  }

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold text-slate-900">
          ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂºÃ¢â‚¬â„¢ Bons de Commande
        </h1>
        <Button
          variant="secondary"
          onClick={() => setShowDebug(!showDebug)}
          className="px-3 py-1.5 text-xs rounded-md"
        >
          {showDebug ? "Masquer Debug JSON" : "Afficher Debug JSON"}
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {showDebug && (
        <div className="mb-4 rounded-md bg-slate-900 px-4 py-3 text-xs text-emerald-300 overflow-x-auto">
          <strong>Payload actuel (JSON) :</strong>
          <pre className="mt-1 whitespace-pre-wrap">
            {JSON.stringify(getPayload(), null, 2)}
          </pre>
        </div>
      )}

      {/* Formulaire de crÃƒÆ’Ã‚Â©ation */}
      <section className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          ÃƒÂ¢Ã…Â¾Ã¢â‚¬Â¢ Nouveau Bon de Commande
        </h3>
        <form
          onSubmit={handleCreatePo}
          className="grid gap-5 md:grid-cols-2"
        >
          <div>
            <label className="block mb-1 text-sm font-medium text-slate-700">
              Fournisseur ({suppliers.length} trouvÃƒÆ’Ã‚Â©s)
            </label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              required
              className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">-- Choisir un fournisseur --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <h4 className="text-sm font-semibold text-slate-800 mb-2">
              Produits disponibles
            </h4>
            <div className="max-h-52 overflow-y-auto rounded-md border border-slate-200 bg-white px-2 py-2 text-sm">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between border-b last:border-none border-slate-100 py-1"
                >
                  <span className="text-slate-700">
                    {p.name} ({p.purchase_price} ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddProductToPo(p)}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    Ajouter
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-2">
              Lignes sÃƒÆ’Ã‚Â©lectionnÃƒÆ’Ã‚Â©es
            </h4>
            <div className="mb-2 max-h-48 overflow-y-auto rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
              {poLines.length === 0 ? (
                <p className="text-slate-400">
                  Aucun produit sÃƒÆ’Ã‚Â©lectionnÃƒÆ’Ã‚Â©.
                </p>
              ) : (
                poLines.map((line, index) => (
                  <div
                    key={index}
                    className="flex justify-between border-b last:border-none border-slate-100 py-1"
                  >
                    <span>
                      {line.name} x {line.quantity}
                    </span>
                    <span className="font-semibold">
                      {(line.quantity * line.unit_price).toFixed(2)} ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬
                    </span>
                  </div>
                ))
              )}
            </div>
            <h4 className="mt-2 text-sm font-semibold text-slate-800">
              Total :{" "}
              <span className="text-slate-900">
                {getPayload().totalAmount.toFixed(2)} ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬
              </span>
            </h4>
            <Button
              type="submit"
              variant="primary"
              className="mt-3 w-full font-bold"
            >
              CrÃƒÆ’Ã‚Â©er le Bon de Commande
            </Button>
          </div>
        </form>
      </section>

      {/* Liste des Bons de Commande */}
      <h3 className="text-lg font-semibold text-slate-800 mb-3">
        ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã¢â‚¬Â¹ Liste des Bons de Commande
      </h3>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">RÃƒÆ’Ã‚Â©fÃƒÆ’Ã‚Â©rence</th>
              <th className="px-4 py-3 text-left">Fournisseur</th>
              <th className="px-4 py-3 text-left">Total</th>
              <th className="px-4 py-3 text-left">Statut</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-slate-500"
                >
                  Aucun Bon de Commande trouvÃƒÆ’Ã‚Â©.
                </td>
              </tr>
            ) : (
              purchaseOrders.map((po) => (
                <tr
                  key={po.id}
                  className="border-b last:border-none border-slate-100"
                >
                  <td className="px-4 py-3">{po.reference}</td>
                  <td className="px-4 py-3">{po.supplier?.name}</td>
                  <td className="px-4 py-3">
                    {Number(po.totalAmount || 0).toFixed(2)} ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬
                  </td>
                  <td className="px-4 py-3">{po.status}</td>
                  <td className="px-4 py-3">
                    {po.status === "draft" && (
                      <button
                        onClick={() => handleConfirmPo(po.id)}
                        className="mr-2 inline-flex items-center rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                      >
                        Confirmer
                      </button>
                    )}
                    {po.status === "confirmed" && (
                      <button
                        onClick={() => handleReceivePo(po.id)}
                        className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        RÃƒÆ’Ã‚Â©ceptionner
                      </button>
                    )}
                    {["received", "partially_received", "completed"].includes(
                      po.status,
                    ) && (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        RÃƒÆ’Ã‚Â©ceptionnÃƒÆ’Ã‚Â©
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}




