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
import { apiFetch } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/router";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import Section from "../components/section";
import { Save, Wrench } from "lucide-react";

const WORKSPACE_ID = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971";

export default function WorkshopPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [diag, setDiag] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(
        `/api/appointments?workspaceId=${WORKSPACE_ID}`
      );
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("erreur chargement planning", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  const startIntervention = async (appId: string) => {
    try {
      const res = await apiFetch(
        `/api/interventions/from-appointment/${appId}`,
        {
          method: "POST",
          body: JSON.stringify({
            workspaceId: WORKSPACE_ID,
            status: "diagnosing",
          }),
        }
      );
      if (res.ok) {
        alert("ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ vÃƒÆ’Ã‚Â©hicule rÃƒÆ’Ã‚Â©ceptionnÃƒÆ’Ã‚Â© !");
        loadData();
      }
    } catch (err) {
      alert("erreur lors de la rÃƒÆ’Ã‚Â©ception");
    }
  };

  const saveDiagnosis = async (interId: string) => {
    if (!diag[interId]) {
      alert("veuillez saisir un texte de diagnostic.");
      return;
    }

    try {
      const res = await apiFetch(
        `/api/interventions/${interId}/diagnosis`,
        {
          method: "PATCH",
          body: JSON.stringify({ diagnosis_text: diag[interId] }),
        }
      );
      if (res.ok) {
        alert("ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ diagnostic enregistrÃƒÆ’Ã‚Â© !");
        loadData();
      } else {
        const error = await res.json();
        alert(error.message);
      }
    } catch (err) {
      alert("erreur lors de l'enregistrement");
    }
  };

  if (!token) return null;

  return (
    <div className="flex flex-col gap-10 p-10 bg-[oklch(0.98_0_0)] min-h-screen font-sans text-[oklch(0.22_0_0)]">
      
      {/* HEADER PREMIUM */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tighter lowercase">
            atelier & interventions
          </h1>
          <p className="text-[oklch(0.45_0_0)] font-medium text-sm">
            suivi technique et diagnostics en temps rÃƒÆ’Ã‚Â©el
          </p>
        </div>
        <Button
          onClick={() => router.push("/appointments")}
          className="rounded-2xl py-6 font-bold uppercase text-[10px] tracking-widest shadow-sm"
        >
          nouveau rdv
        </Button>
      </div>

      {loading ? (
        <div className="py-20 text-center animate-pulse text-[oklch(0.45_0_0)] lowercase tracking-tight">
          mise ÃƒÆ’Ã‚Â  jour du planning...
        </div>
      ) : (
        <Section title="flux atelier">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left border-b border-[oklch(0.92_0_0)]">
                  <th className="pb-4 font-bold text-[oklch(0.45_0_0)] lowercase">client / vÃƒÆ’Ã‚Â©hicule</th>
                  <th className="pb-4 font-bold text-[oklch(0.45_0_0)] lowercase">horaire</th>
                  <th className="pb-4 font-bold text-[oklch(0.45_0_0)] lowercase text-center">statut</th>
                  <th className="pb-4 font-bold text-[oklch(0.45_0_0)] lowercase text-right">action technique</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[oklch(0.96_0_0)]">
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-[oklch(0.45_0_0)] lowercase italic">
                      aucun vÃƒÆ’Ã‚Â©hicule ÃƒÆ’Ã‚Â  l'agenda.
                    </td>
                  </tr>
                ) : (
                  appointments.map((app) => (
                    <tr key={app.id} className="group hover:bg-[oklch(0.99_0_0)] transition-colors">
                      <td className="py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-[oklch(0.22_0_0)] lowercase">
                            {app.vehicle?.client?.name}
                          </span>
                          <span className="text-[10px] text-[oklch(0.45_0_0)] uppercase font-mono tracking-tighter">
                            {app.vehicle?.make} {app.vehicle?.model} ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â {app.vehicle?.plateNumber}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 text-[oklch(0.35_0_0)] font-medium">
                        {new Date(app.scheduled_at).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-5 text-center">
                        <Badge
                          variant={app.intervention ? "company" : "destructive"}
                        >
                          {app.intervention ? app.intervention.status : "absent"}
                        </Badge>
                      </td>
                      <td className="py-5">
                        {!app.intervention ? (
                          <div className="flex justify-end">
                            <button
                              onClick={() => startIntervention(app.id)}
                              className="bg-[oklch(0.22_0_0)] text-white hover:bg-black px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                            >
                              rÃƒÆ’Ã‚Â©ceptionner
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 justify-end">
                            <textarea
                              placeholder="notes techniques..."
                              value={
                                diag[app.intervention.id] !== undefined
                                  ? diag[app.intervention.id]
                                  : app.intervention.diagnosis_text || ""
                              }
                              onChange={(e) =>
                                setDiag({
                                  ...diag,
                                  [app.intervention.id]: e.target.value,
                                })
                              }
                              className="flex-1 max-w-[280px] bg-[oklch(0.98_0_0)] border border-[oklch(0.92_0_0)] rounded-xl px-4 py-2 text-xs outline-none focus:border-[oklch(0.45_0_0)] transition-colors h-11 resize-none"
                            />
                            <button
                              onClick={() => saveDiagnosis(app.intervention.id)}
                              className="p-3 rounded-xl bg-[oklch(0.96_0_0)] hover:bg-[oklch(0.22_0_0)] hover:text-white transition-all group/btn"
                              title="enregistrer"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                router.push(
                                  `/create-proforma?interventionId=${app.intervention.id}`
                                )
                              }
                              className="bg-[oklch(0.22_0_0)] text-white hover:bg-black px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm whitespace-nowrap"
                            >
                              devis
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </div>
  );
}







