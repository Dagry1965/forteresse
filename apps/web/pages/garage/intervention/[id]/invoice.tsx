import { useEffect, useState } from "react";
import { API } from "../../../../lib/api";
import { CONFIG } from "../../../../lib/config";

type InvoicePart = {
  label?: string;
  qty: number | string;
  unitPrice: number | string;
};

type InvoiceLabor = {
  label?: string;
  hours: number | string;
  rate: number | string;
};

type Invoice = {
  id: string;
  createdAt: string;
  client?: {
    name?: string;
  };
  vehicle: {
    make?: string;
    model?: string;
    plateNumber?: string;
  };
  parts?: InvoicePart[];
  labor?: InvoiceLabor[];
};

export default function InvoicePage() {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  const interventionId =
    typeof window !== "undefined"
      ? window.location.pathname.split("/")[4]
      : null;

  async function load() {
    if (!interventionId) return;

    const data = await API.get<Invoice>(
      `${CONFIG.API_BASE}/api/invoices/${interventionId}`
    );

    setInvoice(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <p className="p-10">Chargement...</p>;
  if (!invoice) return <p className="p-10">Aucune facture trouvée.</p>;

  const totalParts = invoice.parts?.reduce(
    (sum: number, p: InvoicePart) => sum + Number(p.qty) * Number(p.unitPrice),
    0
  ) ?? 0;

  const totalLabor = invoice.labor?.reduce(
    (sum: number, l: InvoiceLabor) => sum + Number(l.hours) * Number(l.rate),
    0
  ) ?? 0;

  const total = totalParts + totalLabor;
  const tva = total * 0.077; // TVA Suisse 7.7%
  const totalTTC = total + tva;

  return (
    <div className="p-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Facture</h1>

      {/* Infos facture */}
      <div className="border p-4 rounded bg-white shadow-sm mb-6">
        <p>
          <b>Facture n° :</b> {invoice.id}
        </p>
        <p>
          <b>Date :</b>{" "}
          {new Date(invoice.createdAt).toLocaleDateString()}
        </p>
        <p>
          <b>Client :</b> {invoice.client?.name}
        </p>
        <p>
          <b>Véhicule :</b> {invoice.vehicle.make}{" "}
          {invoice.vehicle.model} ({invoice.vehicle.plateNumber})
        </p>
      </div>

      {/* Pièces */}
      <h2 className="text-xl font-semibold mb-3">Pièces</h2>
      <div className="space-y-2 mb-6">
        {invoice.parts?.map((p: InvoicePart, i: number) => (
          <div key={i} className="border p-3 rounded bg-white shadow-sm">
            <p>
              {p.label} — {p.qty} × {p.unitPrice} CHF ={" "}
              <b>{Number(p.qty) * Number(p.unitPrice)} CHF</b>
            </p>
          </div>
        ))}
      </div>

      {/* Main d’œuvre */}
      <h2 className="text-xl font-semibold mb-3">Main d’œuvre</h2>
      <div className="space-y-2 mb-6">
        {invoice.labor?.map((l: InvoiceLabor, i: number) => (
          <div key={i} className="border p-3 rounded bg-white shadow-sm">
            <p>
              {l.label} — {l.hours} h × {l.rate} CHF ={" "}
              <b>{Number(l.hours) * Number(l.rate)} CHF</b>
            </p>
          </div>
        ))}
      </div>

      {/* Totaux */}
      <div className="border p-4 rounded bg-white shadow-sm mb-6">
        <p>
          <b>Total pièces :</b> {totalParts} CHF
        </p>
        <p>
          <b>Total main d’œuvre :</b> {totalLabor} CHF
        </p>
        <p>
          <b>TVA (7.7%) :</b> {tva.toFixed(2)} CHF
        </p>
        <p className="text-xl font-bold mt-2">
          Total TTC : {totalTTC.toFixed(2)} CHF
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          className="bg-gray-700 text-white px-4 py-2 rounded"
          onClick={() =>
            window.print()
          }
        >
          Imprimer
        </button>

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() =>
            window.open(
              `${CONFIG.API_BASE}/api/invoices/${invoice.id}/pdf`,
              "_blank"
            )
          }
        >
          Télécharger PDF
        </button>
      </div>
    </div>
  );
}
