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
import { Button } from "../components/ui/button";

const API_BASE = "http://localhost:4000";

export default function InterventionsPage() {
  const [interventions, setInterventions] = useState<any[]>([]);
  const [diagnosis, setDiagnosis] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const loadInterventions = () => {
    fetch(`${API_BASE}/interventions`)
      .then((res) => res.json())
      .then(setInterventions)
      .catch((err) => {
        console.error("Erreur chargement interventions:", err);
        setInterventions([]);
      });
  };

  useEffect(() => {
    loadInterventions();
  }, []);

  const saveDiagnosis = async (id: string) => {
    const res = await fetch(`${API_BASE}/interventions/${id}/diagnosis`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ diagnosis_text: diagnosis }),
    });
    if (res.ok) {
      alert("ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Diagnostic enregistrÃƒÆ’Ã‚Â© ! PrÃƒÆ’Ã‚Âªt pour le devis.");
      loadInterventions();
      setDiagnosis("");
      setSelectedId("");
    } else {
      alert("Erreur lors de l'enregistrement du diagnostic.");
    }
  };

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto font-sans">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">
        ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂºÃ‚Â ÃƒÂ¯Ã‚Â¸Ã‚Â Atelier : Interventions &amp; Diagnostics
      </h1>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Client</th>
              <th className="px-4 py-3 text-left">VÃƒÆ’Ã‚Â©hicule</th>
              <th className="px-4 py-3 text-left">Statut</th>
              <th className="px-4 py-3 text-left">Diagnostic</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {interventions.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-slate-500"
                >
                  Aucune intervention trouvÃƒÆ’Ã‚Â©e.
                </td>
              </tr>
            ) : (
              interventions.map((i) => (
                <tr
                  key={i.id}
                  className="border-b last:border-none border-slate-100"
                >
                  <td className="px-4 py-3">
                    {i.appointment?.vehicle?.client?.name || "-"}
                  </td>
                  <td className="px-4 py-3">
                    {i.appointment?.vehicle?.make}{" "}
                    {i.appointment?.vehicle?.model}
                  </td>
                  <td className="px-4 py-3">{i.status}</td>
                  <td className="px-4 py-3">
                    {i.diagnosis_text || (
                      <span className="text-slate-400">
                        En attente...
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedId(i.id)}
                    >
                      Modifier Diagnostic
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedId && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">
            Saisir le diagnostic pour l'intervention sÃƒÆ’Ã‚Â©lectionnÃƒÆ’Ã‚Â©e
          </h3>
          <textarea
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="Ex: Disques de frein HS, PrÃƒÆ’Ã‚Â©voir remplacement..."
            className="w-full min-h-[100px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <Button
            variant="primary"
            onClick={() => saveDiagnosis(selectedId)}
            className="mt-3"
          >
            VALIDER LE DIAGNOSTIC
          </Button>
        </div>
      )}
    </div>
  );
}


