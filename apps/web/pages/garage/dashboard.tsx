'use client';

import React, { useEffect, useState } from 'react';
import { appointmentService } from '@/services/appointmentService';
import { workshopService } from '@/services/workshopService';
import { financeService } from '@/services/financeService';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    pendingAppointments: 0,
    ongoingInterventions: 0,
    unpaidInvoices: 0,
  });

  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const pending = await appointmentService.getPending();
      const interventions = await workshopService.getAll();
      const invoices = await financeService.getUnpaidInvoices();

      // 🔥 Normalisation ultra-sécurisée
      const interList = interventions ?? [];

      const invoiceList = invoices ?? [];

      // 🔥 IMPORTANT : plus aucun filter → reduce est 100% safe
      const ongoing = interList.reduce((count, item) => {
        return item?.status !== 'completed' ? count + 1 : count;
      }, 0);

      setStats({
        pendingAppointments: Array.isArray(pending) ? pending.length : 0,
        ongoingInterventions: ongoing,
        unpaidInvoices: invoiceList.length,
      });
    } catch (err) {
      console.error('Erreur chargement dashboard', err);

      setStats({
        pendingAppointments: 0,
        ongoingInterventions: 0,
        unpaidInvoices: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) return <div className="p-10">Chargement du tableau de bord...</div>;

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold tracking-tight lowercase mb-8">
        Tableau de bord
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border rounded-xl p-6">
          <div className="text-sm text-[oklch(0.45_0_0)]">Rendez-vous en attente</div>
          <div className="text-4xl font-bold">{stats.pendingAppointments}</div>
        </div>

        <div className="border rounded-xl p-6">
          <div className="text-sm text-[oklch(0.45_0_0)]">Interventions en cours</div>
          <div className="text-4xl font-bold">{stats.ongoingInterventions}</div>
        </div>

        <div className="border rounded-xl p-6">
          <div className="text-sm text-[oklch(0.45_0_0)]">Factures impayées</div>
          <div className="text-4xl font-bold">{stats.unpaidInvoices}</div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-bold mb-4">Actions rapides</h2>
        <div className="flex gap-4">
          <Button>Nouveau rendez-vous</Button>
          <Button>Gérer les clients</Button>
          <Button>Aller à la caisse</Button>
        </div>
      </div>
    </div>
  );
}


