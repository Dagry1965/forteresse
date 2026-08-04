'use client';

import React, { useEffect, useState } from 'react';
import { financeService } from '@/services/financeService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/router';
import {
  Printer,
  ChevronLeft,
  Loader2,
  CreditCard,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { INVOICE_STATUS } from '../../../../../shared/constants/status.constants';

type InvoicePayment = {
  amount?: number | string;
};

type PaymentSchedule = {
  due_date?: string;
};

type InvoiceClient = {
  name?: string;
};

type Invoice = {
  id: string;
  reference?: string;
  status?: string;
  total?: number | string;
  created_at: string;
  client?: InvoiceClient;
  payments?: InvoicePayment[];
  Payment?: InvoicePayment[];
  paymentSchedules?: PaymentSchedule[];
};

type PaymentResult = {
  status?: string;
};

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
};

export default function InvoicesListPage() {
  const router = useRouter();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('especes');
  const [paying, setPaying] = useState(false);

  const loadInvoices = async () => {
    try {
      const result = await financeService.getAllInvoices();
      setInvoices(Array.isArray(result) ? (result as Invoice[]) : []);
    } catch {
      toast.error('Erreur lors du chargement des factures');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const getPayments = (invoice: Invoice): InvoicePayment[] =>
    invoice?.payments ?? invoice?.Payment ?? [];

  const getPaidAmount = (invoice: Invoice) => {
    const totalPaid = getPayments(invoice).reduce(
      (sum: number, payment: InvoicePayment) =>
        sum + Number(payment.amount || 0),
      0,
    );

    return Math.min(totalPaid, Number(invoice?.total || 0));
  };

  const getRemainingAmount = (invoice: Invoice) =>
    Math.max(
      Number(invoice?.total || 0) - getPaidAmount(invoice),
      0,
    );

  const openPaymentForm = (invoice: Invoice) => {
    const remaining = getRemainingAmount(invoice);

    setSelectedInvoice(invoice);
    setAmount(remaining.toFixed(2));
    setMethod('especes');
  };

  const closePaymentForm = () => {
    if (paying) return;

    setSelectedInvoice(null);
    setAmount('');
    setMethod('especes');
  };

  const handlePayment = async () => {
    if (!selectedInvoice) return;

    const numericAmount = Number(amount.replace(',', '.'));
    const remaining = getRemainingAmount(selectedInvoice);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error('Saisissez un montant valide');
      return;
    }

    if (numericAmount > remaining) {
      toast.error(
        `Le montant dépasse le solde restant de ${remaining.toFixed(2)} EUR`,
      );
      return;
    }

    setPaying(true);

    try {
      const result = await financeService.payInvoice(
        selectedInvoice.id,
        {
          amount: numericAmount,
          method,
        },
      );

      const paymentResult = result as PaymentResult;

      toast.success(
        paymentResult.status === INVOICE_STATUS.PAID
          ? 'Facture entièrement payée'
          : 'Paiement partiel enregistré',
      );

      closePaymentForm();
      setLoading(true);
      await loadInvoices();
    } catch (error: unknown) {
      const apiError = error as ApiError;

      toast.error(
        apiError.response?.data?.message ||
          apiError.message ||
          "Impossible d'enregistrer le paiement",
      );
    } finally {
      setPaying(false);
    }
  };

  const totals = invoices.reduce(
    (acc, invoice) => {
      const total = Number(invoice.total || 0);
      const paid = getPaidAmount(invoice);
      const remaining = getRemainingAmount(invoice);
      const dueDate = invoice.paymentSchedules?.[0]?.due_date;
      const isOverdue =
        dueDate &&
        new Date(dueDate) < new Date() &&
        remaining > 0;

      acc.totalInvoiced += total;
      acc.totalPaid += paid;
      acc.totalRemaining += remaining;

      if (isOverdue) {
        acc.totalOverdue += remaining;
      }

      return acc;
    },
    {
      totalInvoiced: 0,
      totalPaid: 0,
      totalRemaining: 0,
      totalOverdue: 0,
    },
  );

  const formatMoney = (value: number) =>
    value.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
    });

  const getStatusStyle = (status: string) => {
    switch (status?.toUpperCase()) {
      case INVOICE_STATUS.PAID:
        return 'bg-green-100 text-green-700 border-green-200';
      case INVOICE_STATUS.PARTIALLY_PAID:
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'OVERDUE':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="p-8 max-w-[1500px] mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/finance')}
          >
            <ChevronLeft size={20} />
            Retour
          </Button>

          <h1 className="text-3xl font-black uppercase tracking-tighter">
            Historique Factures
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5 border-slate-200 bg-white">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Total facturé
          </p>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {formatMoney(totals.totalInvoiced)} EUR
          </p>
        </Card>

        <Card className="p-5 border-green-200 bg-green-50">
          <p className="text-[10px] font-black uppercase tracking-widest text-green-600">
            Total encaissé
          </p>
          <p className="mt-2 text-2xl font-black text-green-700">
            {formatMoney(totals.totalPaid)} EUR
          </p>
        </Card>

        <Card className="p-5 border-orange-200 bg-orange-50">
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-600">
            Reste à encaisser
          </p>
          <p className="mt-2 text-2xl font-black text-orange-700">
            {formatMoney(totals.totalRemaining)} EUR
          </p>
        </Card>

        <Card className="p-5 border-red-200 bg-red-50">
          <p className="text-[10px] font-black uppercase tracking-widest text-red-600">
            Montant échu
          </p>
          <p className="mt-2 text-2xl font-black text-red-700">
            {formatMoney(totals.totalOverdue)} EUR
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-2xl bg-white">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <Loader2
              className="animate-spin text-blue-600"
              size={40}
            />
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">
              Chargement des factures...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] text-left border-collapse">
              <thead className="bg-slate-50/50 border-b text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="p-5">Référence</th>
                  <th className="p-5">Client</th>
                  <th className="p-5">Date</th>
                  <th className="p-5 text-center">Statut</th>
                  <th className="p-5 text-right">Total</th>
                  <th className="p-5 text-right">Déjà payé</th>
                  <th className="p-5 text-right">Reste à payer</th>
                  <th className="p-5">Échéance</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {invoices.map((invoice) => {
                  const status = invoice.status?.toUpperCase();
                  const paidAmount = getPaidAmount(invoice);
                  const remaining = getRemainingAmount(invoice);
                  const dueDate =
                    invoice.paymentSchedules?.[0]?.due_date ?? null;

                  return (
                    <tr
                      key={invoice.id}
                      className="hover:bg-slate-50/30 transition-all"
                    >
                      <td className="p-5 font-bold text-blue-600 uppercase">
                        {invoice.reference}
                      </td>

                      <td className="p-5 font-black text-slate-700">
                        {invoice.client?.name || '---'}
                      </td>

                      <td className="p-5 text-slate-500 text-sm font-medium">
                        {new Date(
                          invoice.created_at,
                        ).toLocaleDateString('fr-FR')}
                      </td>

                      <td className="p-5 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${getStatusStyle(
                            invoice.status ?? '',
                          )}`}
                        >
                          {invoice.status}
                        </span>
                      </td>

                      <td className="p-5 text-right font-black text-slate-900 whitespace-nowrap">
                        {Number(invoice.total).toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                        })}{' '}
                        EUR
                      </td>

                      <td className="p-5 text-right font-bold text-green-700 whitespace-nowrap">
                        {paidAmount.toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                        })}{' '}
                        EUR
                      </td>

                      <td className="p-5 text-right font-black text-orange-700 whitespace-nowrap">
                        {remaining.toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                        })}{' '}
                        EUR
                      </td>

                      <td className="p-5 text-sm font-medium text-slate-500">
                        {dueDate
                          ? new Date(dueDate).toLocaleDateString('fr-FR')
                          : 'Non définie'}
                      </td>

                      <td className="p-5">
                        <div className="flex justify-end gap-2">
                          {status !== INVOICE_STATUS.PAID && remaining > 0 && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white font-black text-[10px] uppercase h-9 px-4"
                              onClick={() =>
                                openPaymentForm(invoice)
                              }
                            >
                              <CreditCard
                                size={14}
                                className="mr-2"
                              />
                              Encaisser
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 font-black text-[10px] uppercase h-9 px-4 transition-all"
                            onClick={() =>
                              router.push(
                                `/finance/invoices/print/${invoice.id}`,
                              )
                            }
                          >
                            <Printer
                              size={14}
                              className="mr-2"
                            />
                            Imprimer / PDF
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <Card className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-black uppercase">
                  Encaisser la facture
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedInvoice.reference} —{' '}
                  {selectedInvoice.client?.name || 'Client'}
                </p>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={closePaymentForm}
                disabled={paying}
              >
                <X size={18} />
              </Button>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Solde restant
                </p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {getRemainingAmount(
                    selectedInvoice,
                  ).toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                  })}{' '}
                  ?
                </p>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-2">
                  Montant encaissé
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={getRemainingAmount(selectedInvoice)}
                  value={amount}
                  onChange={(event) =>
                    setAmount(event.target.value)
                  }
                  className="w-full h-12 rounded-xl border border-slate-200 px-4 font-bold outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-2">
                  Mode de paiement
                </label>
                <select
                  value={method}
                  onChange={(event) =>
                    setMethod(event.target.value)
                  }
                  className="w-full h-12 rounded-xl border border-slate-200 px-4 font-bold bg-white outline-none focus:border-blue-500"
                >
                  <option value="especes">Espèces</option>
                  <option value="carte">Carte bancaire</option>
                  <option value="virement">Virement</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-12 font-black uppercase"
                  onClick={closePaymentForm}
                  disabled={paying}
                >
                  Annuler
                </Button>

                <Button
                  className="flex-1 h-12 bg-green-600 hover:bg-green-700 font-black uppercase"
                  onClick={handlePayment}
                  disabled={paying}
                >
                  {paying ? (
                    <Loader2
                      size={18}
                      className="animate-spin mr-2"
                    />
                  ) : (
                    <CreditCard
                      size={18}
                      className="mr-2"
                    />
                  )}
                  Valider
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
