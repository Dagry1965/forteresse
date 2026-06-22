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
import { CreditCard, Users, Package, TrendingUp, RefreshCcw } from "lucide-react";
import { apiFetch } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import Section from "../components/section";
import KpiCard from "../components/kpi-card";
import { Badge } from "../components/ui/badge"; // Import du nouveau composant
import CountUp from "react-countup";

const WORKSPACE_ID = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971";

export default function Dashboard() {
  const { token } = useAuth();
  const [data, setData] = useState<any>({
    invoices: {}, revenue: null, clients: [], products: [], logs: []
  });
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [resStatus, resRev, resClients, resProds, resLogs] = await Promise.all([
        apiFetch(`/api/reports/invoices-by-status?workspaceId=${WORKSPACE_ID}`),
        apiFetch(`/api/reports/revenue?workspaceId=${WORKSPACE_ID}`),
        apiFetch(`/api/reports/top-clients?limit=5&workspaceId=${WORKSPACE_ID}`),
        apiFetch(`/api/reports/top-products?limit=5&workspaceId=${WORKSPACE_ID}`),
        apiFetch(`/api/finance/audit-logs?workspaceId=${WORKSPACE_ID}`),
      ]);

      setData({
        invoices: resStatus.ok ? await resStatus.json() : {},
        revenue: resRev.ok ? await resRev.json() : null,
        clients: resClients.ok ? await resClients.json() : [],
        products: resProds.ok ? await resProds.json() : [],
        logs: resLogs.ok ? await resLogs.json() : []
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (token) load(); }, [token]);

  if (!token) return null;

  const totalInvoices = Object.values(data.invoices).reduce((a: any, b: any) => a + b, 0);

  return (
    <div className="flex flex-col gap-10">

      {/* HEADER PREMIUM RE-STABILISÃƒÆ’Ã¢â‚¬Â° */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-[oklch(0.22_0_0)] lowercase">
            tableau de bord
          </h1>
          <p className="text-[oklch(0.45_0_0)]">
            aperÃƒÆ’Ã‚Â§u global de lÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢activitÃƒÆ’Ã‚Â©
          </p>
        </div>
        <button 
          onClick={load} 
          className="p-3 rounded-full bg-white border border-[oklch(0.92_0_0)] hover:bg-[oklch(0.95_0_0)] transition-colors shadow-sm"
        >
          <RefreshCcw className={`w-5 h-5 text-[oklch(0.45_0_0)] ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        <KpiCard label="chiffre d'affaires" value={<CountUp end={data.revenue?.totalRevenue || 0} decimals={2} suffix=".-" />} icon={<CreditCard />} />
        <KpiCard label="total factures" value={<CountUp end={totalInvoices} />} icon={<Package />} />
        <KpiCard label="clients actifs" value={<CountUp end={data.clients.length} />} icon={<Users />} />
        <KpiCard label="articles vendus" value={<CountUp end={data.products.reduce((a:any, b:any) => a + (b.qty || 0), 0)} />} icon={<TrendingUp />} />
      </div>

      {/* SECTIONS PREMIUM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* STATUTS */}
        <Section title="factures par statut">
          <div className="flex flex-col gap-4">
            {Object.entries(data.invoices).length > 0 ? Object.entries(data.invoices).map(([status, count]: any) => (
              <div key={status} className="flex justify-between items-center border-b border-[oklch(0.96_0_0)] pb-2 last:border-none">
                <span className="capitalize font-medium text-[oklch(0.35_0_0)]">{status}</span>
                <span className="font-bold text-[oklch(0.22_0_0)]">{count}</span>
              </div>
            )) : <div className="text-[oklch(0.45_0_0)] text-sm">aucune donnÃƒÆ’Ã‚Â©e</div>}
          </div>
        </Section>

        {/* TOP CLIENTS AVEC BADGE B2B */}
        <Section title="top 5 clients">
          <div className="flex flex-col gap-4">
            {data.clients.length > 0 ? data.clients.map((c: any, i: number) => (
              <div key={i} className="flex justify-between items-center border-b border-[oklch(0.96_0_0)] pb-2 last:border-none">
                <div className="flex items-center gap-3">
                  {/* Badge dynamique selon le type de client */}
                  <Badge variant={c.type === 'COMPANY' ? 'company' : 'individual'}>
                    {c.type === 'COMPANY' ? 'flotte' : 'perso'}
                  </Badge>
                  <span className="font-medium text-[oklch(0.35_0_0)] lowercase">{c.name}</span>
                </div>
                <span className="font-bold text-[oklch(0.22_0_0)]">{c.total.toFixed(2)}.-</span>
              </div>
            )) : <div className="text-[oklch(0.45_0_0)] text-sm">aucune donnÃƒÆ’Ã‚Â©e</div>}
          </div>
        </Section>

        {/* PRODUITS */}
        <Section title="top piÃƒÆ’Ã‚Â¨ces & articles vendus">
          <div className="flex flex-col gap-4">
            {data.products.length > 0 ? data.products.map((p: any, i: number) => (
              <div key={i} className="flex justify-between items-center border-b border-[oklch(0.96_0_0)] pb-2 last:border-none text-sm">
                <span className="text-[oklch(0.35_0_0)] lowercase">{p.name} (x{p.qty})</span>
                <span className="font-bold text-[oklch(0.22_0_0)]">{p.revenue.toFixed(2)}.-</span>
              </div>
            )) : <div className="text-[oklch(0.45_0_0)] text-sm">aucune donnÃƒÆ’Ã‚Â©e</div>}
          </div>
        </Section>

        {/* ACTIVITÃƒÆ’Ã¢â‚¬Â° */}
        <Section title="activitÃƒÆ’Ã‚Â© rÃƒÆ’Ã‚Â©cente">
          <div className="h-64 overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex flex-col gap-6">
              {data.logs.length > 0 ? data.logs.map((log: any, i: number) => (
                <div key={i} className="flex flex-col gap-1 border-l-2 border-[oklch(0.92_0_0)] pl-4">
                  <span className="text-[10px] uppercase tracking-tighter text-[oklch(0.55_0_0)] font-bold">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                  <span className="text-sm font-bold text-[oklch(0.22_0_0)] lowercase leading-none">
                    {log.action.replace("_", " ")}
                  </span>
                  <p className="text-xs text-[oklch(0.45_0_0)]">{log.message}</p>
                </div>
              )) : <div className="text-[oklch(0.45_0_0)] text-sm">aucune activitÃƒÆ’Ã‚Â© rÃƒÆ’Ã‚Â©cente</div>}
            </div>
          </div>
        </Section>

      </div>
    </div>
  );
}







