import React, { useEffect, useState, useMemo } from "react";
import { EmptyState } from '../components/ui/empty-state';
import { Tabs } from '../components/ui/tabs';
import { Alert } from '../components/ui/alert';
import { TextareaField } from '../components/ui/textarea-field';
import { SelectField } from '../components/ui/select-field';
import { ResponsiveGrid } from '../components/ui/responsive-grid';
import { DataTable } from '../components/ui/data-table';
import { DateField } from '../components/ui/date-field';
import { TextField } from '../components/ui/text-field';
import Link from "next/link";
import { apiFetch } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";

const WORKSPACE_ID = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971";

export default function InventoryAlertsPage() {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [filterUrgency, setFilterUrgency] = useState("all"); // all, critical, low

  const loadData = async () => {
    setLoading(true);
    try {
      const [resAlerts, resSuppliers] = await Promise.all([
        apiFetch(`/api/inventory/alerts?workspaceId=${WORKSPACE_ID}`),
        apiFetch(`/api/inventory/supplier?workspaceId=${WORKSPACE_ID}`),
      ]);

      if (resAlerts.ok) setAlerts(await resAlerts.json());
      if (resSuppliers.ok) setSuppliers(await resSuppliers.json());
    } catch (err) {
      console.error("Erreur de chargement", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((p) => {
      const currentQty = p.inventory?.quantity || 0;
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.reference.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSupplier =
        selectedSupplier === "all" || p.supplier?.id === selectedSupplier;
      const matchesUrgency =
        filterUrgency === "all" ||
        (filterUrgency === "critical" && currentQty === 0) ||
        (filterUrgency === "low" && currentQty > 0);

      return matchesSearch && matchesSupplier && matchesUrgency;
    });
  }, [alerts, searchTerm, selectedSupplier, filterUrgency]);

  const stats = {
    total: filteredAlerts.length,
    critical: filteredAlerts.filter(
      (p) => (p.inventory?.quantity || 0) === 0
    ).length,
    value: filteredAlerts.reduce(
      (acc, p) => acc + p.purchase_price * p.min_stock_alert,
      0
    ),
  };

  if (!token) {
    return (
      <p className="p-6 text-slate-600">Connexion requise...</p>
    );
  }

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto font-sans bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="m-0 text-3xl font-bold text-slate-900">
            ÃƒÂ¢Ã…Â¡Ã‚Â ÃƒÂ¯Ã‚Â¸Ã‚Â RÃƒÆ’Ã‚Â©approvisionnement
          </h1>
          <p className="mt-1 text-slate-500 text-sm">
            GÃƒÆ’Ã‚Â©rez vos ruptures et stocks critiques
          </p>
        </div>
        <Link href="/purchase-orders">
          <Button variant="primary" className="rounded-xl shadow-md">
            + Nouveau Bon de Commande
          </Button>
        </Link>
      </div>

      {/* Statistiques */}
      <div className="grid gap-5 mb-6 md:grid-cols-3">
        <div className="rounded-xl border-l-4 border-red-500 bg-white px-4 py-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase">
            Ruptures Totales
          </div>
          <div className="mt-1 text-2xl font-bold text-red-500">
            {stats.critical}
          </div>
        </div>
        <div className="rounded-xl border-l-4 border-amber-500 bg-white px-4 py-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase">
            Articles ÃƒÆ’Ã‚Â  commander
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-500">
            {stats.total}
          </div>
        </div>
        <div className="rounded-xl border-l-4 border-sky-500 bg-white px-4 py-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase">
            Estimation Commande
          </div>
          <div className="mt-1 text-2xl font-bold text-sky-500">
            {stats.value.toFixed(2)} ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="mb-6 flex flex-wrap gap-3 items-center rounded-xl bg-white px-4 py-3 shadow-sm border border-slate-200">
        <input
          type="text"
          placeholder="Rechercher nom ou rÃƒÆ’Ã‚Â©f..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[200px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <select
          value={selectedSupplier}
          onChange={(e) => setSelectedSupplier(e.target.value)}
          className="min-w-[180px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="all">Tous les fournisseurs</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={filterUrgency}
          onChange={(e) => setFilterUrgency(e.target.value)}
          className="min-w-[180px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="all">Toutes urgences</option>
          <option value="critical">Rupture (0 stock)</option>
          <option value="low">Stock faible</option>
        </select>
        <Button
          variant="outline"
          onClick={loadData}
          className="px-3 py-2 text-sm"
        >
          ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ¢â‚¬Å¾
        </Button>
      </div>

      {/* Tableau */}
      {loading ? (
        <p className="py-10 text-center text-slate-500">
          Analyse des stocks...
        </p>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-slate-600">
                  Produit
                </th>
                <th className="px-4 py-3 text-left text-slate-600">
                  Fournisseur
                </th>
                <th className="px-4 py-3 text-center text-slate-600">
                  Stock
                </th>
                <th className="px-4 py-3 text-center text-slate-600">
                  Seuil
                </th>
                <th className="px-4 py-3 text-center text-slate-600">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Aucune alerte correspondante.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((p: any) => {
                  const qty = p.inventory?.quantity || 0;
                  const isCritical = qty === 0;
                  return (
                    <tr
                      key={p.id}
                      className="border-b last:border-none border-slate-100"
                    >
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900">
                          {p.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          RÃƒÆ’Ã‚Â©f: {p.reference}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-800">
                        {p.supplier?.name || "---"}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                            isCritical
                              ? "bg-red-50 text-red-600"
                              : "bg-amber-50 text-amber-600",
                          ].join(" ")}
                        >
                          {qty}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-slate-600">
                        {p.min_stock_alert}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                          ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂºÃ¢â‚¬â„¢ Commander
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


