'use client';

import React, { useEffect, useState } from 'react';
import { financeService } from '@/services/financeService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/router';
import { Printer, FileText, ChevronLeft, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function InvoicesListPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financeService.getAllInvoices()
      .then(res => setInvoices(res ?? []))
      .catch(() => toast.error("Erreur lors du chargement des factures"))
      .finally(() => setLoading(false));
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID': return 'bg-green-100 text-green-700 border-green-200';
      case 'PARTIALLY_PAID': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/finance')}>
            <ChevronLeft size={20} /> Retour
          </Button>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Historique Factures</h1>
        </div>
      </div>

      {/* TABLEAU DES FACTURES */}
      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-2xl bg-white">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-blue-600" size={40} />
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Chargement des factures...</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="p-5">RÃ©fÃ©rence</th>
                <th className="p-5">Client</th>
                <th className="p-5">Date</th>
                <th className="p-5 text-center">Statut</th>
                <th className="p-5 text-right">Montant TTC</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50/30 transition-all group">
                  <td className="p-5 font-bold text-blue-600 uppercase">
                    {invoice.reference}
                  </td>
                  <td className="p-5 font-black text-slate-700">
                    {invoice.client?.name || '---'}
                  </td>
                  <td className="p-5 text-slate-500 text-sm font-medium">
                    {new Date(invoice.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="p-5 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${getStatusStyle(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="p-5 text-right font-black text-slate-900">
                    {Number(invoice.total).toLocaleString()} â‚¬
                  </td>
                  <td className="p-5 text-right">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 font-black text-[10px] uppercase h-9 px-4 transition-all"
                      onClick={() => router.push(`/finance/invoices/print/${invoice.id}`)}
                    >
                      <Printer size={14} className="mr-2" /> Imprimer / PDF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

