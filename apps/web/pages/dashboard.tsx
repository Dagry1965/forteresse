import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import { useAuth } from "../context/AuthContext";

import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { ScrollArea } from "../components/ui/scroll-area";
import CountUp from "react-countup";
import { KPI } from "../components/ui/kpi";


const WORKSPACE_ID = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971";

export default function DashboardPage() {
  const { token } = useAuth();

  const [invoicesByStatus, setInvoicesByStatus] = useState<Record<string, number>>({});
  const [revenue, setRevenue] = useState<any>(null);
  const [topClients, setTopClients] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0];

  const [from, setFrom] = useState(firstDayOfMonth);
  const [to, setTo] = useState(lastDayOfMonth);

  const totalInvoices = Object.values(invoicesByStatus).reduce((sum, count) => sum + count, 0);
  const totalArticlesSold = topProducts.reduce((sum, p) => sum + (p.qty || 0), 0);

  async function loadDashboardData() {
    try {
      const [resStatus, resRev, resClients, resProds, resLogs] = await Promise.all([
        apiFetch(`/api/reports/invoices-by-status?workspaceId=${WORKSPACE_ID}`),
        apiFetch(`/api/reports/revenue?from=${from}&to=${to}&workspaceId=${WORKSPACE_ID}`),
        apiFetch(`/api/reports/top-clients?limit=5&workspaceId=${WORKSPACE_ID}`),
        apiFetch(`/api/reports/top-products?limit=5&workspaceId=${WORKSPACE_ID}`),
        apiFetch(`/api/finance/audit-logs?workspaceId=${WORKSPACE_ID}`),
      ]);

      if (resStatus?.ok) setInvoicesByStatus(await resStatus.json());
      if (resRev?.ok) setRevenue(await resRev.json());
      if (resClients?.ok) setTopClients(await resClients.json());
      if (resProds?.ok) setTopProducts(await resProds.json());
      if (resLogs?.ok) setAuditLogs(await resLogs.json());
    } catch (err) {
      console.error("Erreur dashboard", err);
    }
  }

  useEffect(() => {
    if (token) loadDashboardData();
  }, [token, from, to]);

  if (!token) return <p className="p-6">Redirection vers la connexion...</p>;

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen space-y-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Tableau de bord</h1>
          <p className="text-slate-500 mt-1">Vue d’ensemble de votre activité</p>
        </div>
        <Button onClick={loadDashboardData} variant="default" className="rounded-xl">
          🔄 Actualiser
        </Button>
      </div>

      {/* ==================== KPIs RÉUTILISABLES ==================== */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        
        {/* CA */}
        <KPI
          label="Chiffre d'affaires"
          icon="💰"
          value={
            revenue ? (
              <>
                <CountUp 
                  end={revenue.totalRevenue || 0} 
                  duration={1.6} 
                  separator=" " 
                />
                <span className="text-4xl"> €</span>
              </>
            ) : (
              "---"
            )
          }
        />

        {/* Total Factures */}
        <KPI
          label="Total factures"
          icon="📋"
          value={<CountUp end={totalInvoices} duration={1.3} />}
        />

        {/* Clients actifs */}
        <KPI
          label="Clients actifs"
          icon="⭐"
          value={<CountUp end={topClients.length} duration={1.3} />}
        />

        {/* Articles vendus */}
        <KPI
          label="Articles vendus"
          icon="📦"
          value={<CountUp end={totalArticlesSold} duration={1.3} />}
        />
      </div>

      {/* ==================== CONTENU DÉTAILLÉ ==================== */}
      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">

        {/* Colonne gauche */}
        <div className="md:col-span-2 space-y-8">

          {/* Factures par statut */}
          <Card className="rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <CardHeader>
              <CardTitle>📋 Factures par statut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {Object.keys(invoicesByStatus).length > 0 ? (
                Object.entries(invoicesByStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center py-2 border-b last:border-none">
                    <span className="capitalize px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                      {status}
                    </span>
                    <span className="font-semibold text-lg">
                      <CountUp end={count} duration={0.8} />
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-slate-400">Aucune donnée</p>
              )}
            </CardContent>
          </Card>

          {/* Top Clients */}
          <Card className="rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <CardHeader>
              <CardTitle>⭐ Top 5 Clients</CardTitle>
            </CardHeader>
            <CardContent>
              {topClients.length > 0 ? (
                topClients.map((c, i) => (
                  <div key={i} className="flex justify-between py-2 border-b last:border-none">
                    <span>{c.name}</span>
                    <span className="font-semibold text-emerald-600">{c.total.toFixed(2)} €</span>
                  </div>
                ))
              ) : (
                <p className="text-slate-400">Aucune donnée</p>
              )}
            </CardContent>
          </Card>

          {/* Top Produits */}
          <Card className="rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <CardHeader>
              <CardTitle>📦 Top Pièces & Articles vendus</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-slate-500 border-b">
                    <th className="pb-3">Article</th>
                    <th className="pb-3">Qté</th>
                    <th className="pb-3 text-right">CA</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.length > 0 ? (
                    topProducts.map((p, i) => (
                      <tr key={i} className="border-b last:border-none hover:bg-slate-50">
                        <td className="py-3">{p.name}</td>
                        <td className="py-3 font-medium">
                          <CountUp end={p.qty} duration={0.6} />
                        </td>
                        <td className="py-3 text-right font-semibold text-emerald-600">
                          {p.revenue.toFixed(2)} €
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-slate-400">Aucune donnée</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Activité récente */}
        <Card className="rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition h-fit sticky top-6">
          <CardHeader>
            <CardTitle>🕒 Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[520px] pr-2">
              {auditLogs.length > 0 ? (
                auditLogs.map((log, i) => (
                  <div key={i} className="flex gap-3 mb-4">
                    <div className="w-2 h-2 mt-2 bg-sky-500 rounded-full flex-shrink-0" />
                    <div>
                      <div className="text-xs text-slate-500">
                        {new Date(log.createdAt).toLocaleString("fr-FR", {
                          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </div>
                      <div className="font-medium text-sm">{log.action.replace("_", " ")}</div>
                      <div className="text-sm text-slate-600">{log.message}</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-sm">Aucune activité récente.</p>
              )}
            </ScrollArea>
            <Button variant="outline" className="w-full mt-6 rounded-xl">
              Voir tout l'historique
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}