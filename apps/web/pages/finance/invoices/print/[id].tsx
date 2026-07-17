'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { financeService } from '@/services/financeService';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PrintInvoicePage() {
  const router = useRouter();
  const { id } = router.query;
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setLoading(true);
      financeService.getInvoiceById(id as string)
        .then(res => setInvoice(res))
        .catch(() => toast.error("Impossible de charger la facture"))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!invoice) return <div className="p-10 text-center">Facture introuvable.</div>;

  return (
    <>
      {/* STYLE CSS POUR SUPPRIMER L'URL ET LA DATE DU NAVIGATEUR */}
      <style jsx global>{`
        @media print {
          /* Supprime les headers/footers du navigateur (URL, Date, etc.) */
          @page { 
            margin: 0; 
          }
          body { 
            margin: 0;
            -webkit-print-color-adjust: exact; 
          }
          /* Force la disparition de TOUT ce qui n'est pas la facture (Sidebar, etc.) */
          nav, aside, footer, .sidebar, header {
            display: none !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-slate-50 p-4 sm:p-8 print:bg-white print:p-0 print:m-0">
        
        {/* BOUTONS (Cachés à l'impression) */}
        <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center print:hidden">
          <Button variant="ghost" onClick={() => router.back()} className="font-bold">
            <ArrowLeft size={18} className="mr-2" /> Retour
          </Button>
          <Button onClick={() => window.print()} className="bg-blue-600 text-white font-black px-8 h-12 rounded-xl flex gap-2">
            <Printer size={20} /> Imprimer la facture
          </Button>
        </div>

        {/* LA FACTURE (Design épuré) */}
        <div className="max-w-4xl mx-auto bg-white p-12 text-slate-800 min-h-[29.7cm] print:p-12 print:shadow-none print:max-w-full">
          
          {/* HEADER */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-10">
            <div>
              <h1 className="text-2xl font-black uppercase text-slate-900">Garage Pro</h1>
              <p className="text-[10px] font-medium text-slate-500">123 Avenue de l'Automobile, 75000 Paris</p>
              <p className="text-[10px] font-bold text-slate-800">SIRET : 123 456 789 00012</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-black text-slate-300 uppercase tracking-widest">Facture</h2>
              <p className="font-bold text-xs text-slate-900 mt-1">{invoice.reference}</p>
              <p className="text-[9px] text-slate-400 uppercase">Le {new Date(invoice.created_at).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          {/* CLIENT */}
          <div className="flex justify-between mb-10">
            <div className="w-1/2">
              <p className="text-[8px] font-black text-blue-600 uppercase mb-2">Facturé à</p>
              <p className="font-bold text-base">{invoice.client?.name}</p>
              <p className="text-xs text-slate-500">{invoice.client?.email}</p>
              <p className="text-xs text-slate-500">{invoice.client?.phone}</p>
            </div>
            <div className="text-right text-xs">
              <p className="text-slate-400 uppercase text-[8px] font-bold">Règlement</p>
              <p className="font-bold">{invoice.type === 'FLEET' ? 'Virement 30j' : 'Au comptant'}</p>
            </div>
          </div>

          {/* TABLEAU */}
          <table className="w-full mb-10">
            <thead>
              <tr className="border-b border-slate-900 text-[9px] font-black uppercase text-slate-400">
                <th className="py-2 text-left">Désignation</th>
                <th className="py-2 text-center w-12">Qté</th>
                <th className="py-2 text-right w-20">Prix HT</th>
                <th className="py-2 text-right w-20">Total HT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.lines?.map((line: any) => (
                <tr key={line.id} className="text-[11px]">
                  <td className="py-3 font-medium text-slate-800">{line.label}</td>
                  <td className="py-3 text-center">{line.quantity}</td>
                  <td className="py-3 text-right">{Number(line.unit_price).toLocaleString()} €</td>
                  <td className="py-3 text-right font-bold">{Number(line.total).toLocaleString()} €</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* TOTALS */}
          <div className="flex justify-end border-t border-slate-900 pt-4">
            <div className="w-48 space-y-1">
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Total HT</span>
                <span>{(invoice.total / 1.2).toLocaleString()} €</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>TVA (20%)</span>
                <span>{(invoice.total - (invoice.total / 1.2)).toLocaleString()} €</span>
              </div>
              <div className="flex justify-between text-base font-black border-t border-slate-900 pt-2 mt-2">
                <span>TOTAL TTC</span>
                <span>{Number(invoice.total).toLocaleString()} €</span>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-32 border-t pt-4 flex justify-between text-[7px] text-slate-400 uppercase font-bold">
            <p>Paiement attendu sous 30 jours. Pénalités de retard : 3x taux légal.</p>
            <p>Garage Pro - SAS au capital de 50 000€ - RCS Paris 123 456 789</p>
          </div>
        </div>
      </div>
    </>
  );
}
