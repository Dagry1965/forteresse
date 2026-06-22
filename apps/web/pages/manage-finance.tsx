import React, { useEffect, useState } from "react";
import { EmptyState } from '../components/ui/empty-state';
import { Tabs } from '../components/ui/tabs';
import { Alert } from '../components/ui/alert';
import { TextareaField } from '../components/ui/textarea-field';
import { SelectField } from '../components/ui/select-field';
import { ResponsiveGrid } from '../components/ui/responsive-grid';
import { DataTable } from '../components/ui/data-table';
import { DateField } from '../components/ui/date-field';
import { TextField } from '../components/ui/text-field';
import { CONFIG } from "../lib/config";

export default function ManageFinance() {
  const [proformas, setProformas] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  const loadProformas = () => {
    fetch(`${CONFIG.API_BASE}/finance/proformas`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProformas(data);
        } else {
          console.error("Le backend n'a pas renvoyÃƒÆ’Ã‚Â© un tableau:", data);
          setProformas([]);
        }
      })
      .catch((err) => {
        console.error("Erreur rÃƒÆ’Ã‚Â©seau:", err);
        setProformas([]);
      });
  };

  useEffect(() => {
    loadProformas();
  }, []);

  const approveProforma = async (id: string) => {
    const res = await fetch(
      `${CONFIG.API_BASE}/finance/proforma/${id}/approve`,
      { method: "PATCH" },
    );

    if (res.ok) {
      setMessage(
        "ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Devis approuvÃƒÆ’Ã‚Â© ! Stock mis ÃƒÆ’Ã‚Â  jour et facture gÃƒÆ’Ã‚Â©nÃƒÆ’Ã‚Â©rÃƒÆ’Ã‚Â©e.",
      );
      loadProformas();
    } else {
      const err = await res.json();
      alert(`Erreur: ${err.message}`);
    }
  };

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto font-sans">
      <h1 className="text-3xl font-bold text-slate-900 mb-4">
        Gestion des Devis et Facturation
      </h1>

      {message && (
        <p className="mb-4 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-4 py-2">
          {message}
        </p>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Client</th>
              <th className="px-4 py-3 text-left">VÃƒÆ’Ã‚Â©hicule</th>
              <th className="px-4 py-3 text-left">Total</th>
              <th className="px-4 py-3 text-left">Statut</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {proformas.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-slate-500"
                >
                  Aucun devis trouvÃƒÆ’Ã‚Â©.
                </td>
              </tr>
            ) : (
              proformas.map((p) => (
                <tr
                  key={p.id}
                  className="border-b last:border-none border-slate-100"
                >
                  <td className="px-4 py-3">
                    {p.intervention?.appointment?.vehicle?.client?.name ||
                      "Inconnu"}
                  </td>
                  <td className="px-4 py-3">
                    {p.intervention?.appointment?.vehicle?.make}{" "}
                    {p.intervention?.appointment?.vehicle?.model}
                  </td>
                  <td className="px-4 py-3">
                    {p.total_amount?.toFixed(2)} ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        "inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold",
                        p.status === "approved"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700",
                      ].join(" ")}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.status === "draft" && (
                      <button
                        onClick={() => approveProforma(p.id)}
                        className="inline-flex items-center rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
                      >
                        APPROUVER &amp; FACTURER
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}




