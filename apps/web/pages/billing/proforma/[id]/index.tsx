'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { proformaService } from '@/services/proformaService';
import { Button } from '@/components/ui/button';
import {
  Printer,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  FileText,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';
import { CASE_STATUS, PROFORMA_STATUS } from '../../../../../../shared/constants/status.constants';

export default function ProformaPrintPage() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      proformaService.getOne(id as string)
        .then(setData)
        .catch(() => toast.error("Erreur de chargement"))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
  if (!data) return <div className="p-10 text-center text-red-500 font-bold">Document introuvable.</div>;

  const client = data.case?.client;
  const vehicle = data.case?.vehicle;
  const interventions = data.case?.interventions || [];

  const getWorkshopUrl = () => {
    const interventionId = data.case?.interventions?.[0]?.id;

    return interventionId
      ? `/workshop/case/${interventionId}`
      : '/workshop';
  };

  const handleAcceptProforma = async () => {
    try {
      setActionLoading(true);
      await proformaService.acceptProforma(data.id);
      toast.success(
        "Accord client enregistré. Les travaux peuvent commencer.",
      );
      router.push(getWorkshopUrl());
    } catch (e) {
      toast.error(
        "Erreur lors de l'enregistrement de l'accord client",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToInvoice = async () => {
    try {
      setActionLoading(true);
      await proformaService.convertToInvoice(data.id);
      toast.success("La facture a été créée avec succès.");
      router.push('/finance/invoices');
    } catch (e: any) {
      toast.error(
        e?.message || "Erreur lors de la création de la facture",
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      {/* 1. CSS CRUCIAL : Supprime Sidebar, URL, Date et Numéros de page du navigateur */}
      <style jsx global>{`
        @media print {
          @page { 
            margin: 0; 
            size: auto; 
          }
          body { 
            margin: 0; 
            background: white;
            -webkit-print-color-adjust: exact; 
          }
          /* Masque absolument tout ce qui n'est pas le bloc blanc A4 */
          nav, aside, footer, header, .print\\:hidden, .sidebar, [role="navigation"] {
            display: none !important;
          }
          .min-h-screen { background: white !important; padding: 0 !important; }
          .shadow-2xl { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div className="min-h-screen bg-slate-50 p-4 md:p-10 print:p-0 print:bg-white">

        {/* BARRE D'ACTIONS (Masquée à l'impression) */}
        <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
          <Button variant="ghost" onClick={() => router.back()} className="font-bold">
            <ArrowLeft size={16} className="mr-2" /> Retour
          </Button>

          <div className="flex flex-wrap justify-end gap-2">
            {data.status === PROFORMA_STATUS.DRAFT && (
              <Button
                onClick={handleAcceptProforma}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700 text-white font-bold h-10 px-4 rounded-xl flex gap-2"
              >
                {actionLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                Enregistrer l'accord client
              </Button>
            )}

            {data.status === PROFORMA_STATUS.ACCEPTED &&
              data.case?.status !== CASE_STATUS.COMPLETED &&
              data.case?.status !== CASE_STATUS.INVOICED && (
                <Button
                  onClick={() => router.push(getWorkshopUrl())}
                  disabled={actionLoading}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-10 px-4 rounded-xl flex gap-2"
                >
                  <Wrench size={16} />
                  Retour aux travaux
                </Button>
              )}

            {data.status === PROFORMA_STATUS.ACCEPTED &&
              data.case?.status === CASE_STATUS.COMPLETED && (
                <Button
                  onClick={handleConvertToInvoice}
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold h-10 px-4 rounded-xl flex gap-2"
                >
                  {actionLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <FileText size={16} />
                  )}
                  Créer la facture
                </Button>
              )}

            {data.case?.status === CASE_STATUS.INVOICED && (
              <Button
                onClick={() => router.push('/finance/invoices')}
                disabled={actionLoading}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-10 px-4 rounded-xl flex gap-2"
              >
                <FileText size={16} />
                Voir les factures
              </Button>
            )}

            <Button
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-4 rounded-xl flex gap-2"
            >
              <Printer size={16} />
              Imprimer / PDF
            </Button>
          </div>
        </div>

        {/* FEUILLE A4 (PROFORMA) */}
        <div className="max-w-4xl mx-auto bg-white p-12 min-h-[29.7cm] text-slate-800 print:p-16 print:max-w-full shadow-2xl print:shadow-none">
          
          {/* HEADER */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-10">
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-blue-600 tracking-tighter">VOTRE GARAGE</h1>
              <div className="text-xs font-bold text-slate-500">
                <p>123 Rue de la Mécanique, 75000 Paris</p>
                <p>Siret: 123 456 789 00012</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-black uppercase tracking-widest text-slate-300">Proforma</h2>
              <p className="text-sm font-bold text-slate-900 mt-1">{data.reference}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase">Le {new Date(data.created_at).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          {/* INFOS CLIENT ET VÉHICULE */}
          <div className="grid grid-cols-2 gap-12 mb-12 border-b border-slate-100 pb-10">
            <div>
              <h3 className="text-[10px] font-black uppercase text-blue-600 mb-2 tracking-widest">Client</h3>
              <p className="font-black text-xl text-slate-900 leading-tight">{client?.name}</p>
              <p className="text-sm text-slate-500 font-medium">{client?.phone}</p>
              <p className="text-sm text-slate-500 font-medium">{client?.email}</p>
            </div>
            <div className="text-right">
              <h3 className="text-[10px] font-black uppercase text-blue-600 mb-2 tracking-widest">Véhicule</h3>
              <p className="font-black text-xl text-slate-900">{vehicle?.brand} {vehicle?.model}</p>
              <p className="font-black text-sm border-2 border-slate-900 px-3 py-1 rounded-lg inline-block mt-2">
                {vehicle?.registration}
              </p>
            </div>
          </div>

          {/* TABLEAU DES TRAVAUX */}
          <table className="w-full mb-10">
            <thead>
              <tr className="border-b-2 border-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="text-left py-4">Désignation des travaux / Pièces</th>
                <th className="text-center py-4 w-16">Qté</th>
                <th className="text-right py-4 w-24">Prix Unit.</th>
                <th className="text-right py-4 w-24">Total HT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {interventions.map((int: any) => (
                <React.Fragment key={int.id}>
                  {/* Titre de l'intervention */}
                  <tr className="bg-slate-50">
                    <td colSpan={4} className="py-2.5 px-3 font-black text-blue-700 text-[11px] uppercase italic tracking-tight">
                      Phase : {int.description}
                    </td>
                  </tr>
                  {/* Détail des pièces */}
                  {int.InterventionPart?.map((part: any) => (
                    <tr key={part.id}>
                      <td className="py-4 text-xs font-bold text-slate-800">{part.item?.name}</td>
                      <td className="py-4 text-center text-xs">{part.quantity}</td>
                      <td className="py-4 text-right text-xs font-medium">{Number(part.price_snapshot).toLocaleString('fr-FR')} €</td>
                      <td className="py-4 text-right text-xs font-black text-slate-900">
                        {(part.price_snapshot * part.quantity).toLocaleString('fr-FR')} €
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {/* RÉSUMÉ FINANCIER */}
          <div className="flex justify-end pt-6 border-t-2 border-slate-900">
            <div className="w-64 space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase">
                <span>Total HT</span>
                <span className="text-slate-900">{(data.total / 1.2).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase">
                <span>TVA (20%)</span>
                <span className="text-slate-900">{(data.total - (data.total / 1.2)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
              </div>
              <div className="flex justify-between items-center border-t-4 border-blue-600 pt-4 mt-4">
                <span className="font-black uppercase text-xs tracking-widest text-blue-600">Total TTC</span>
                <span className="font-black text-3xl text-blue-600">{data.total.toLocaleString('fr-FR')} €</span>
              </div>
            </div>
          </div>

          {/* FOOTER LÉGAL */}
          <div className="mt-32 pt-10 border-t border-slate-100 text-center">
            <div className="inline-block border-2 border-slate-100 p-6 rounded-2xl">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Information Devis</p>
              <p className="text-xs font-black text-slate-800 uppercase italic">
                Ce document est une proforma (Valide 30 jours).
              </p>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">Merci de votre confiance. Garage Pro © 2026</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
