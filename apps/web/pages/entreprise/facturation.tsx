import { useState, useEffect } from "react";
import { API } from "../../lib/api";
import { CONFIG } from "../../lib/config";

type EnterpriseInvoice = {
  id: string;
  totalTTC: number;
  createdAt: string;
};

type EnterpriseBillingSummary = {
  company: {
    name: string;
  };
  periodLabel: string;
  count: number;
  total: number;
  invoices: EnterpriseInvoice[];
};

export default function FacturationEntreprise() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [summary, setSummary] = useState<EnterpriseBillingSummary | null>(null);

  const companyId =
    typeof window !== "undefined"
      ? localStorage.getItem("companyId")
      : null;

  async function load() {
    if (!companyId) return;

    const data = await API.get(
      `${CONFIG.API_BASE}/api/enterprise/${companyId}/billing/${year}/${month}`
    );

    setSummary(data as EnterpriseBillingSummary);
  }

  useEffect(() => {
    load();
  }, [year, month]);

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Facturation mensuelle</h1>

      {/* Sélecteurs */}
      <div className="flex gap-4 mb-6">
        <select
          className="border p-2 rounded"
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>

        <select
          className="border p-2 rounded"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <option key={i} value={year - i}>
              {year - i}
            </option>
          ))}
        </select>
      </div>

      {/* Résultats */}
      {summary && (
        <div className="border p-4 rounded bg-white shadow-sm">
          <p>
            <b>Entreprise :</b> {summary.company.name}
          </p>
          <p>
            <b>Période :</b> {summary.periodLabel}
          </p>
          <p>
            <b>Nombre d'interventions :</b> {summary.count}
          </p>
          <p>
            <b>Total TTC :</b> {summary.total} CHF
          </p>

          <button
            className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
            onClick={() =>
              window.open(
                `${CONFIG.API_BASE}/api/enterprise/${companyId}/billing/${year}/${month}/pdf`,
                "_blank"
              )
            }
          >
            Télécharger PDF
          </button>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            Détail des factures
          </h2>

          <ul className="space-y-2">
            {summary.invoices.map((inv) => (
              <li key={inv.id} className="border p-3 rounded">
                Facture {inv.id} — {inv.totalTTC} CHF —{" "}
                {new Date(inv.createdAt).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

