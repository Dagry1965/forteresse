'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

import { appointmentService } from '@/services/appointmentService';
import { interventionService } from '@/services/interventionService';
import type { Intervention } from '@/services/interventionService';
import { financeService } from '@/services/financeService';
import { inventoryService } from '@/services/inventoryService';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { INTERVENTION_STATUS } from '../../../shared/constants/status.constants';

import { StockAlerts } from '@/modules/inventory/components/StockAlerts';
import { PaymentReminders } from '@/modules/finance/components/PaymentReminders';
import { RevenueChart } from '@/modules/finance/components/RevenueChart';

import { 
  Calendar, 
  Wrench, 
  CreditCard, 
  LayoutDashboard, 
  Users,
  Plus,
  Package,
  Info,
  ChevronRight
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loadingAuth } = useAuth();

  const [stats, setStats] = useState({
    pendingAppointments: 0,
    ongoingInterventions: 0,
    unpaidInvoices: 0,
    stockValue: 0,
    overdueCount: 0,
  });

  const [chartData, setChartData] = useState<Array<{ name: string; total: number }>>([]);   // ← Données du graphique
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loadingAuth && !isAuthenticated) router.push('/login');
  }, [loadingAuth, isAuthenticated, router]);

  const loadDashboardData = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const workspaceId = localStorage.getItem('current_workspace_id') || undefined;

      const [
        pendingRes,
        interventionsRes,
        invoicesRes,
        stockRes,
        remindersRes,
        statsRes                     // ← Nouvel appel
      ] = await Promise.all([
        appointmentService.getPending(workspaceId).catch(() => []),
        interventionService.getAll().catch(() => []),
        financeService.getUnpaidInvoices(workspaceId).catch(() => []),
        inventoryService.getStockValue(workspaceId).catch(() => ({ value: 0 })),
        financeService.getOverdueReminders(workspaceId).catch(() => []),
        financeService.getStats(workspaceId).catch(() => ({ turnover: [] }))   // ← Ajout
      ]);

      // Mise à jour des statistiques KPI
      setStats({
        pendingAppointments: Array.isArray(pendingRes) ? pendingRes.length : 0,
        ongoingInterventions: Array.isArray(interventionsRes)
          ? interventionsRes.filter((i: Intervention) =>
              i.status !== INTERVENTION_STATUS.COMPLETED
            ).length
          : 0,
        unpaidInvoices: Array.isArray(invoicesRes) ? invoicesRes.length : 0,
        stockValue:
          (stockRes as { value?: number; totalValue?: number })?.value ??
          (stockRes as { value?: number; totalValue?: number })?.totalValue ??
          0,
        overdueCount: Array.isArray(remindersRes) ? remindersRes.length : 0,
      });

      // Mise à jour des données du graphique
      setChartData(statsRes.turnover || []);

    } catch (err: unknown) {
      console.error(err);
      if (
        err &&
        typeof err === 'object' &&
        'status' in err &&
        err.status === 401
      ) router.push('/login');
      else toast.error("Erreur lors du chargement du dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) loadDashboardData();
  }, [isAuthenticated]);

  if (loadingAuth || !isAuthenticated || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        Chargement...
      </div>
    );
  }

  const workspace = user.memberships?.[0]?.workspace;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 space-y-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-sm mb-1 uppercase tracking-wider">
            <LayoutDashboard size={16} />
            Vue d'ensemble
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Bonjour, {user.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Voici l'activité de <span className="text-slate-900 font-bold">{workspace?.name || 'votre garage'}</span> aujourd'hui.
          </p>
        </div>
        
        <Button
          onClick={() => router.push('/appointments')}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 h-12 font-bold shadow-lg shadow-blue-200 flex gap-2"
        >
          <Plus size={18} /> Nouveau RDV
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLONNE PRINCIPALE */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* ... Vos 4 cartes KPI restent identiques ... */}
            <Card className="p-6 hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => router.push('/appointments')}>
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">RDV en attente</p>
                  <p className="text-4xl font-black mt-2">{stats.pendingAppointments}</p>
                </div>
                <Calendar size={32} className="text-orange-500" />
              </div>
            </Card>

            <Card className="p-6 hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => router.push('/workshop/board')}>
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">En réparation</p>
                  <p className="text-4xl font-black mt-2">{stats.ongoingInterventions}</p>
                </div>
                <Wrench size={32} className="text-blue-500" />
              </div>
            </Card>

            <Card 
              className={`p-6 hover:scale-[1.02] transition-transform cursor-pointer border-l-4 ${stats.overdueCount > 0 ? 'border-l-red-500 shadow-red-50' : 'border-l-slate-100'}`} 
              onClick={() => router.push('/finance')}
            >
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Impayés</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-black mt-2">{stats.unpaidInvoices}</p>
                    {stats.overdueCount > 0 && (
                      <span className="text-red-600 text-[10px] font-black animate-pulse uppercase">
                        {stats.overdueCount} retards
                      </span>
                    )}
                  </div>
                </div>
                <CreditCard size={32} className={stats.overdueCount > 0 ? 'text-red-500' : 'text-slate-300'} />
              </div>
            </Card>

            <Card className="p-6 hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => router.push('/inventory')}>
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Valeur Stock</p>
                  <p className="text-3xl font-black mt-2 text-blue-600">
                    {stats.stockValue.toLocaleString()} €
                  </p>
                </div>
                <Package size={32} className="text-blue-400" />
              </div>
            </Card>
          </div>

          {/* === GRAPHIQUE DE PERFORMANCE === */}
          <Card className="p-8 border-none shadow-sm rounded-3xl bg-white">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                  Performance Financière
                </h2>
                <p className="text-sm text-slate-500 font-medium">
                  Chiffre d'affaires HT des 6 derniers mois
                </p>
              </div>
              <div className="flex gap-2">
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  Live
                </span>
              </div>
            </div>
            
            <RevenueChart data={chartData} />
          </Card>

          {/* Raccourcis */}
          <div>
            <h2 className="text-lg font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
              <ChevronRight size={20} className="text-blue-600" />
              Accès Rapide
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Atelier', icon: Wrench, path: '/workshop/board', color: 'bg-blue-50 text-blue-600' },
                { label: 'Clients', icon: Users, path: '/clients', color: 'bg-purple-50 text-purple-600' },
                { label: 'Achats', icon: Plus, path: '/purchase-orders', color: 'bg-green-50 text-green-600' },
                { label: 'Stock', icon: Package, path: '/inventory', color: 'bg-slate-50 text-slate-600' },
              ].map((item, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="h-28 flex flex-col gap-3 hover:bg-white hover:shadow-md border-slate-200 transition-all rounded-2xl group"
                  onClick={() => router.push(item.path)}
                >
                  <div className={`p-3 rounded-xl ${item.color} group-hover:scale-110 transition-transform`}>
                    <item.icon size={24} />
                  </div>
                  <span className="font-bold text-slate-700">{item.label}</span>
                </Button>
              ))}
            </div>
          </div>

        </div>

        {/* SIDEBAR */}
        <div className="lg:col-span-4 space-y-6">
          <PaymentReminders />
          <StockAlerts />

          <Card className="p-6 bg-slate-900 text-white shadow-xl rounded-2xl border-none">
            <div className="flex gap-4 items-start">
              <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                <Info size={20} />
              </div>
              <div>
                <p className="font-bold text-sm">Trésorerie</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed italic">
                  "Clôturez vos interventions terminées pour générer les factures rapidement et maintenir un cash-flow sain."
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
