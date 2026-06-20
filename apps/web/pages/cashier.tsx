import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Modal } from "../components/ui/modal";
import { Button } from "../components/ui/button";

// Configuration API
const API_BASE = "http://localhost:4000/api";
const WORKSPACE_ID = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971";

export default function CashierPage() {
  const { token, logout } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [message, setMessage] = useState<{ text: string; type: string }>({
    text: "",
    type: "",
  });
  const [loading, setLoading] = useState(true);

  // États pour le Modal d'encaissement
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [amountToPay, setAmountToPay] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<
    "carte" | "espèces" | "virement"
  >("carte");
  const [isProcessing, setIsProcessing] = useState(false);

  // Charger les factures impayées
  const loadInvoices = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const res = await fetch(
        `${API_BASE}/finance/unpaid?workspaceId=${WORKSPACE_ID}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-workspace-id": WORKSPACE_ID,
          },
        }
      );

      if (res.status === 401) {
        logout();
        return;
      }

      const data = await res.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur chargement factures", err);
      setMessage({
        text: "Erreur lors du chargement des factures",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [token]);

  // Ouvrir la fenêtre modale
  const openPaymentModal = (invoice: any, remains: number) => {
    setSelectedInvoice(invoice);
    setAmountToPay(remains);
    setPaymentMethod("carte"); // Méthode par défaut
    setModalOpen(true);
  };

  // Enregistrer le paiement via le Modal
  const processPayment = async () => {
    if (!selectedInvoice) return;

    setIsProcessing(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await fetch(`${API_BASE}/finance/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          invoice_id: selectedInvoice.id,
          workspaceId: WORKSPACE_ID,
          amount: Number(amountToPay),
          method: paymentMethod,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          text: `✅ Paiement de ${amountToPay}€ encaissé par ${paymentMethod} !`,
          type: "success",
        });
        setModalOpen(false);
        loadInvoices();
      } else {
        alert(data.message || "Erreur lors du paiement");
      }
    } catch (err) {
      alert("Erreur de connexion au serveur");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!token) {
    return (
      <p className="p-6 text-slate-600">Chargement de la session...</p>
    );
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto font-sans">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="m-0 text-2xl sm:text-3xl font-bold text-slate-900">
          🏦 Caisse & Encaissements
        </h1>
        <Button variant="secondary" onClick={loadInvoices} className="rounded-xl">
          🔄 Actualiser
        </Button>
      </div>

      {/* MESSAGES */}
      {message.text && (
        <div
          className={[
            "mb-5 rounded-lg border px-4 py-3 font-semibold",
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-700",
          ].join(" ")}
        >
          {message.text}
        </div>
      )}

      {/* TABLEAU */}
      {loading ? (
        <p className="text-slate-500">Analyse des factures en cours...</p>
      ) : invoices.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-xl shadow-sm">
          <p className="text-lg text-slate-500 m-0">
            Toutes les factures sont réglées. Excellent travail !
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">
                  Client / Véhicule
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">
                  Total Facture
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">
                  Déjà payé
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">
                  Reste à payer
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const total = inv.proforma?.total_amount || 0;
                const paid = inv.total_paid || 0;
                const remain = total - paid;

                return (
                  <tr
                    key={inv.id}
                    className="border-b last:border-none border-slate-100"
                  >
                    <td className="px-4 py-4 align-top">
                      <div className="font-semibold text-slate-900 text-sm">
                        {inv.proforma?.intervention?.appointment?.vehicle?.client
                          ?.name || "Client Inconnu"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {inv.proforma?.intervention?.appointment?.vehicle?.make}{" "}
                        {inv.proforma?.intervention?.appointment?.vehicle?.model}{" "}
                        (
                        {
                          inv.proforma?.intervention?.appointment?.vehicle
                            ?.plateNumber
                        }
                        )
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-slate-700">
                      {total.toFixed(2)} €
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-emerald-600 font-medium">
                      {paid.toFixed(2)} €
                    </td>
                    <td className="px-4 py-4 text-right text-red-500 font-bold text-lg">
                      {remain.toFixed(2)} €
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Button
                        variant="success"
                        onClick={() => openPaymentModal(inv, remain)}
                      >
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

      {/* MODAL D'ENCAISSEMENT */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={
          selectedInvoice
            ? `Encaissement - Facture #${selectedInvoice.id.substring(0, 8)}`
            : "Encaissement"
        }
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={isProcessing}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              isLoading={isProcessing}
              onClick={processPayment}
            >
              Valider le paiement
            </Button>
          </>
        }
      >
        <div className="mb-4">
          <label className="block mb-2 font-semibold text-slate-700">
            Montant reçu (€)
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amountToPay}
            onChange={(e) => setAmountToPay(Number(e.target.value))}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-semibold text-slate-700">
            Moyen de paiement
          </label>
          <select
            value={paymentMethod}
            onChange={(e) =>
              setPaymentMethod(e.target.value as "carte" | "espèces" | "virement")
            }
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="carte">💳 Carte Bancaire</option>
            <option value="espèces">💵 Espèces</option>
            <option value="virement">🏦 Virement</option>
          </select>
        </div>

        <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-600">
          Le solde restant dû pour ce client est de{" "}
          <strong className="text-red-500">
            {selectedInvoice
              ? (
                  selectedInvoice.proforma.total_amount -
                  selectedInvoice.total_paid
                ).toFixed(2)
              : 0}{" "}
            €
          </strong>
          .
        </div>
      </Modal>
    </div>
  );
}
