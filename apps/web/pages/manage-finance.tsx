'use client';

import React, { useEffect, useState } from 'react';
import { financeService } from '@/services/financeService';
import { proformaService } from '@/services/proformaService';
import { Button } from '../components/ui/button';
import Section from '../components/section';
import { Card } from '../components/ui/card';

export default function ManageFinancePage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [proformas, setProformas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'invoices' | 'proformas'>('invoices');

  const loadData = async () => {
    setLoading(true);
    try {
      const [unpaidInvoices, allProformas] = await Promise.all([
        financeService.getUnpaidInvoices(),
        proformaService.getAll(),
      ]);

      setInvoices(unpaidInvoices || []);
      setProformas(allProformas || []);
    } catch (error) {
      console.error("Erreur chargement finance", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const convertToInvoice = async (proformaId: string) => {
    try {
      await proformaService.convertToInvoice(proformaId);
      alert("Facture créée avec succès !");
      loadData();
    } catch (error) {
      alert("Erreur lors de la création de la facture");
    }
  };

  if (loading) {
    return <div className="p-10">Chargement des données financières...</div>;
  }

  return (
    <div className="p-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight lowercase">Gestion Financière</h1>
          <p className="text-[oklch(0.45_0_0)]">Factures, devis et suivi des paiements</p>
        </div>
        <Button onClick={loadData} variant="outline">
          Rafraîchir
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-6 py-3 font-bold text-sm rounded-t-xl transition-all ${
            activeTab === 'invoices' 
              ? 'bg-white border border-b-0' 
              : 'text-[oklch(0.45_0_0)] hover:text-black'
          }`}
        >
          Factures impayées ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('proformas')}
          className={`px-6 py-3 font-bold text-sm rounded-t-xl transition-all ${
            activeTab === 'proformas' 
              ? 'bg-white border border-b-0' 
              : 'text-[oklch(0.45_0_0)] hover:text-black'
          }`}
        >
          Devis en attente ({proformas.length})
        </button>
      </div>

      {/* Contenu */}
      {activeTab === 'invoices' && (
        <Section title="Factures impayées">
          {invoices.length === 0 ? (
            <p className="text-[oklch(0.45_0_0)] py-8">Aucune facture impayée.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-4 text-left font-bold text-[oklch(0.45_0_0)]">Client</th>
                    <th className="py-4 text-left font-bold text-[oklch(0.45_0_0)]">Véhicule</th>
                    <th className="py-4 text-right font-bold text-[oklch(0.45_0_0)]">Montant</th>
                    <th className="py-4 text-right font-bold text-[oklch(0.45_0_0)]">Payé</th>
                    <th className="py-4 text-right font-bold text-[oklch(0.45_0_0)]">Reste</th>
                    <th className="py-4 text-center font-bold text-[oklch(0.45_0_0)]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => {
                    const total = invoice.proforma?.total_amount || 0;
                    const paid = invoice.total_paid || 0;
                    const remain = total - paid;

                    return (
                      <tr key={invoice.id} className="border-b hover:bg-[oklch(0.99_0_0)]">
                        <td className="py-4 font-medium">
                          {invoice.proforma?.intervention?.appointment?.vehicle?.client?.name}
                        </td>
                        <td className="py-4 text-sm">
                          {invoice.proforma?.intervention?.appointment?.vehicle?.plateNumber}
                        </td>
                        <td className="py-4 text-right font-medium">{total.toFixed(2)} €</td>
                        <td className="py-4 text-right text-emerald-600">{paid.toFixed(2)} €</td>
                        <td className="py-4 text-right text-red-500 font-bold">{remain.toFixed(2)} €</td>
                        <td className="py-4 text-center">
                          <Button size="sm" onClick={() => alert("Aller à la caisse")}>
                            Encaisser
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      )}

      {activeTab === 'proformas' && (
        <Section title="Devis en attente de facturation">
          {proformas.length === 0 ? (
            <p className="text-[oklch(0.45_0_0)] py-8">Aucun devis en attente.</p>
          ) : (
            <div className="space-y-4">
              {proformas.map((proforma) => (
                <Card key={proforma.id} className="p-6 flex justify-between items-center">
                  <div>
                    <div className="font-bold">
                      {proforma.intervention?.appointment?.vehicle?.client?.name}
                    </div>
                    <div className="text-sm text-[oklch(0.45_0_0)]">
                      {proforma.intervention?.appointment?.vehicle?.plateNumber} • {proforma.total_amount} €
                    </div>
                  </div>
                  <Button onClick={() => convertToInvoice(proforma.id)}>
                    Transformer en facture
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </Section>
      )}
    </div>
  );
}



