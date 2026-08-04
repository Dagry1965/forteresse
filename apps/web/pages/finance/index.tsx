'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { financeService } from '@/services/financeService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileStack,
  Banknote,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Receipt,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

type OverdueInvoiceSchedule = {
  id: string;
  due_date: string;
  amount?: number | string;
  invoice?: {
    id?: string;
    reference?: string;
    client?: {
      name?: string;
    };
  };
};

export default function FinanceHubPage() {
  const router = useRouter();

  const [overdueInvoices, setOverdueInvoices] = useState<OverdueInvoiceSchedule[]>([]);
  const [loadingOverdue, setLoadingOverdue] = useState(true);

  useEffect(() => {
    financeService
      .getOverdueReminders()
      .then((data) => setOverdueInvoices(Array.isArray(data) ? (data as OverdueInvoiceSchedule[]) : []))
      .catch(() =>
        toast.error('Erreur lors du chargement des factures échues'),
      )
      .finally(() => setLoadingOverdue(false));
  }, []);

  const groupedOverdueInvoices = useMemo(() => {
    const grouped = new Map<string, OverdueInvoiceSchedule>();

    for (const schedule of overdueInvoices) {
      const key =
        schedule.invoice?.id ??
        schedule.invoice?.reference ??
        schedule.id;

      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, { ...schedule });
        continue;
      }

      existing.amount =
        Number(existing.amount || 0) +
        Number(schedule.amount || 0);

      if (
        new Date(schedule.due_date) <
        new Date(existing.due_date)
      ) {
        existing.due_date = schedule.due_date;
      }
    }

    return Array.from(grouped.values());
  }, [overdueInvoices]);

  const menuItems = [
    {
      title: 'Facturation Flotte',
      description: 'Regrouper plusieurs dossiers pour une entreprise',
      icon: FileStack,
      path: '/finance/fleet',
      color: 'bg-blue-500',
    },
    {
      title: 'Journal de Caisse',
      description: 'Suivi des encaissements et clôture du jour',
      icon: Banknote,
      path: '/finance/cashier',
      color: 'bg-green-500',
    },
    {
      title: 'Liste des Factures',
      description: 'Historique, impression et encaissement',
      icon: Receipt,
      path: '/finance/invoices',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="p-10 max-w-5xl mx-auto space-y-10">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard')}
        >
          <ArrowLeft size={20} />
          Retour Dashboard
        </Button>

        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900">
            Finance
          </h1>
          <p className="text-slate-500 font-medium">
            Pilotez la rentabilité et les encaissements du garage
          </p>
        </div>
      </div>

      <Card className="overflow-hidden rounded-3xl border-red-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-red-100 bg-red-50 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-600 p-3 text-white">
              <AlertTriangle size={22} />
            </div>

            <div>
              <h2 className="font-black uppercase text-red-900">
                Factures échues
              </h2>
              <p className="text-sm text-red-600">
                Échéances dépassées et non réglées
              </p>
            </div>
          </div>

          <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white">
            {groupedOverdueInvoices.length}
          </span>
        </div>

        {loadingOverdue ? (
          <div className="flex items-center justify-center gap-3 p-10 text-slate-400">
            <Loader2 className="animate-spin" size={22} />
            Chargement des échéances...
          </div>
        ) : groupedOverdueInvoices.length === 0 ? (
          <div className="p-10 text-center font-medium text-slate-400">
            Aucune facture échue.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {groupedOverdueInvoices.map((schedule) => (
              <div
                key={schedule.id}
                className="flex flex-col gap-4 p-5 hover:bg-red-50/30 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-black uppercase text-slate-900">
                    {schedule.invoice?.reference || 'Facture'}
                  </p>

                  <p className="text-sm font-medium text-slate-500">
                    {schedule.invoice?.client?.name || 'Client inconnu'}
                  </p>

                  <p className="mt-1 text-xs font-bold text-red-600">
                    Échue le{' '}
                    {new Date(schedule.due_date).toLocaleDateString(
                      'fr-FR',
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <p className="text-lg font-black text-red-700">
                    {Number(schedule.amount).toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    €
                  </p>

                  <Button
                    size="sm"
                    className="bg-red-600 font-black uppercase hover:bg-red-700"
                    onClick={() =>
                      router.push('/finance/invoices')
                    }
                  >
                    Encaisser
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {menuItems.map((item) => (
          <Card
            key={item.path}
            onClick={() => router.push(item.path)}
            className="group flex cursor-pointer items-center justify-between border-slate-100 p-8 transition-all hover:shadow-xl"
          >
            <div className="flex items-center gap-6">
              <div
                className={`${item.color} rounded-2xl p-4 text-white shadow-lg transition-transform group-hover:scale-110`}
              >
                <item.icon size={32} />
              </div>

              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">
                  {item.title}
                </h2>
                <p className="text-sm text-slate-500">
                  {item.description}
                </p>
              </div>
            </div>

            <ChevronRight
              className="text-slate-300 transition-colors group-hover:text-blue-500"
              size={24}
            />
          </Card>
        ))}
      </div>

      <Card className="relative flex items-center justify-between overflow-hidden rounded-3xl border-none bg-slate-900 p-8 text-white">
        <div className="relative z-10">
          <p className="mb-2 text-xs font-black uppercase tracking-widest text-blue-400">
            Conseil de gestion
          </p>

          <h3 className="max-w-md text-xl font-bold leading-relaxed">
            Consultez régulièrement votre{' '}
            <span className="text-blue-400">
              Journal de Caisse
            </span>{' '}
            pour éviter les écarts en fin de mois.
          </h3>
        </div>

        <TrendingUp
          size={120}
          className="absolute -bottom-4 -right-4 text-white/5"
        />
      </Card>
    </div>
  );
}
