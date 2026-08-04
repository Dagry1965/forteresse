'use client';

import React, { useState, useEffect } from 'react';
import { financeService } from '@/services/financeService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Banknote, 
  CreditCard, 
  ArrowLeft, 
  Calendar as CalendarIcon,
  Download,
  User as UserIcon,
  Clock
} from 'lucide-react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

type CashierPayment = {
  id: string;
  time: string;
  client?: string;
  invoiceRef?: string;
  method?: string;
  processedBy?: string;
  amount: number;
};

type CashierReport = {
  grandTotal?: number;
  totals?: {
    CB?: number;
    CASH?: number;
    TRANSFER?: number;
  };
  count?: number;
  payments?: CashierPayment[];
};

export default function CashierPage() {
  const router = useRouter();
  const [report, setReport] = useState<CashierReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await financeService.getDailyReport(selectedDate);
      setReport(data as CashierReport);
    } catch (error) {
      toast.error("Erreur lors du chargement du rapport de caisse");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [selectedDate]);

  if (!report && loading) return <div className="p-20 text-center font-bold">Chargement de la caisse...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Journal de Caisse</h1>
            <p className="text-slate-500 font-medium">Suivi des encaissements et clôture journalière</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border">
          <CalendarIcon size={18} className="text-blue-500 ml-2" />
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="outline-none font-bold text-slate-700 p-1"
          />
        </div>
      </div>

      {/* RÉSUMÉ DES TOTAUX */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 border-blue-100 bg-blue-600 text-white shadow-lg shadow-blue-100">
          <p className="text-xs font-black uppercase opacity-80">Total Encaissé</p>
          <p className="text-3xl font-black mt-1">{report?.grandTotal?.toLocaleString()} €</p>
        </Card>

        <Card className="p-6 border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-black uppercase text-slate-400">Carte Bancaire</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{report?.totals?.CB?.toLocaleString() || 0} €</p>
            </div>
            <div className="bg-slate-100 p-2 rounded-lg text-slate-600"><CreditCard size={20} /></div>
          </div>
        </Card>

        <Card className="p-6 border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-black uppercase text-slate-400">Espèces</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{report?.totals?.CASH?.toLocaleString() || 0} €</p>
            </div>
            <div className="bg-green-100 p-2 rounded-lg text-green-600"><Banknote size={20} /></div>
          </div>
        </Card>

        <Card className="p-6 border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-black uppercase text-slate-400">Virements</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{report?.totals?.TRANSFER?.toLocaleString() || 0} €</p>
            </div>
            <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><Download size={20} /></div>
          </div>
        </Card>
      </div>

      {/* LISTE DES TRANSACTIONS */}
      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-2xl bg-white">
        <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
          <h2 className="font-black uppercase text-sm tracking-widest text-slate-500">Détail des règlements</h2>
          <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">
            {report?.count} opération(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/30 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="p-5">Heure</th>
                <th className="p-5">Client</th>
                <th className="p-5">Référence Facture</th>
                <th className="p-5">Méthode</th>
                <th className="p-5">Encaissé par</th>
                <th className="p-5 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report?.payments?.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-5 text-slate-400">
                    <div className="flex items-center gap-2 font-medium">
                      <Clock size={14} />
                      {new Date(payment.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="p-5 font-black text-slate-800">{payment.client}</td>
                  <td className="p-5 text-blue-600 font-bold text-sm uppercase">{payment.invoiceRef}</td>
                  <td className="p-5">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[9px] font-black uppercase border border-slate-200">
                      {payment.method}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                      <UserIcon size={12} />
                      {payment.processedBy}
                    </div>
                  </td>
                  <td className="p-5 text-right font-black text-slate-900">
                    {payment.amount.toLocaleString()} €
                  </td>
                </tr>
              ))}

              {report?.payments?.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-20 text-center text-slate-400 font-medium italic">
                    Aucun encaissement enregistré pour cette journée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
