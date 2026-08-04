'use client';

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { financeService } from "@/services/financeService";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { RefreshCcw } from "lucide-react";
import { normalizeList } from "@/utils/normalize";

type PaymentMethod = 'carte' | 'espèces' | 'virement';

type CashierInvoice = {
  id: string;
  total_paid?: number;
  proforma?: {
    total_amount?: number;
    intervention?: {
      appointment?: {
        vehicle?: {
          make?: string;
          model?: string;
          client?: {
            name?: string;
          };
        };
      };
    };
  };
};

export default function CashierPage() {
  const { token, logout } = useAuth();
  const [invoices, setInvoices] = useState<CashierInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Modal
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<CashierInvoice | null>(null);
  const [amountToPay, setAmountToPay] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"carte" | "espèces" | "virement">("carte");

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await financeService.getUnpaidInvoices();

      // 🔥 Correction définitive : normalisation
      setInvoices(normalizeList<CashierInvoice>(data));
    } catch (err) {
      console.error("Erreur chargement factures", err);
      const status =
        err && typeof err === 'object' && 'status' in err
          ? (err as { status?: unknown }).status
          : undefined;

      if (status === 401) logout();
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (token) loadInvoices();
  }, [token]);

  const openPaymentModal = (invoice: CashierInvoice, remain: number) => {
    setSelectedInvoice(invoice);
    setAmountToPay(remain);
    setPaymentMethod("carte");
    setModalOpen(true);
  };

  const processPayment = async () => {
    if (!selectedInvoice) return;

    try {
      await financeService.createPayment({
        invoice_id: selectedInvoice.id,
        amount: Number(amountToPay),
        method: paymentMethod,
      });

      setMessage({
        text: `Paiement de ${amountToPay}€ encaissé par ${paymentMethod} !`,
        type: "success",
      });
      setModalOpen(false);
      loadInvoices();
    } catch (err) {
      alert("Erreur lors du paiement");
    }
  };

  if (!token) return null;

  return (
    <div className="flex flex-col gap-10 p-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[oklch(0.22_0_0)] lowercase">
            Caisse & Encaissements
          </h1>
          <p className="text-[oklch(0.45_0_0)]">Suivi des règlements clients</p>
        </div>
        <button onClick={loadInvoices} className="p-3 rounded-full border hover:bg-gray-100">
          <RefreshCcw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl ${message.type === "success" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">Chargement...</div>
      ) : normalizeList(invoices).length === 0 ? (
        <Card className="p-20 text-center">Toutes les factures sont réglées.</Card>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border p-4">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-4 text-left text-xs font-bold text-[oklch(0.45_0_0)]">Client / Véhicule</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-[oklch(0.45_0_0)]">Total</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-[oklch(0.45_0_0)]">Déjà payé</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-[oklch(0.45_0_0)]">Reste</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-[oklch(0.45_0_0)]">Action</th>
              </tr>
            </thead>
            <tbody>
              {normalizeList(invoices).map((inv) => {
                const total = inv.proforma?.total_amount || 0;
                const paid = inv.total_paid || 0;
                const remain = total - paid;

                return (
                  <tr key={inv.id} className="border-b hover:bg-[oklch(0.99_0_0)]">
                    <td className="px-6 py-5">
                      <div className="font-bold">
                        {inv.proforma?.intervention?.appointment?.vehicle?.client?.name}
                      </div>
                      <div className="text-xs text-[oklch(0.45_0_0)]">
                        {inv.proforma?.intervention?.appointment?.vehicle?.make}{" "}
                        {inv.proforma?.intervention?.appointment?.vehicle?.model}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right font-medium">{total.toFixed(2)} €</td>
                    <td className="px-6 py-5 text-right text-emerald-600">{paid.toFixed(2)} €</td>
                    <td className="px-6 py-5 text-right text-red-500 font-bold text-lg">{remain.toFixed(2)} €</td>
                    <td className="px-6 py-5 text-center">
                      <Button onClick={() => openPaymentModal(inv, remain)}>
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

      {/* MODAL DE PAIEMENT */}
      {isModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-6">Encaisser Facture</h2>

            <div className="mb-4">
              <label className="text-sm font-bold">Montant reçu</label>
              <input
                type="number"
                value={amountToPay}
                onChange={(e) => setAmountToPay(Number(e.target.value))}
                className="w-full mt-1 border rounded-2xl px-4 py-3 text-2xl font-bold"
              />
            </div>

            <div className="mb-6">
              <label className="text-sm font-bold">Moyen de paiement</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full mt-1 border rounded-2xl px-4 py-3"
              >
                <option value="carte">Carte bancaire</option>
                <option value="espèces">Espèces</option>
                <option value="virement">Virement</option>
              </select>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1">
                Annuler
              </Button>
              <Button onClick={processPayment} className="flex-1">
                Valider le paiement
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
