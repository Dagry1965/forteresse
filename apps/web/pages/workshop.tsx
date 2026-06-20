import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/router";
import { Button } from "../components/ui/button";

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
      console.error("Erreur chargement planning", err);
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
        alert("✅ Véhicule réceptionné à l'atelier !");
        loadData();
      }
    } catch (err) {
      alert("Erreur lors de la réception");
    }
  };

  const saveDiagnosis = async (interId: string) => {
    if (!diag[interId]) {
      alert("Veuillez saisir un texte de diagnostic.");
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
        alert("✅ Diagnostic et pré-devis enregistrés !");
        loadData();
      } else {
        const error = await res.json();
        alert(error.message);
      }
    } catch (err) {
      alert("Erreur lors de l'enregistrement");
    }
  };

  if (!token) {
    return (
      <p className="p-5 text-slate-600">Veuillez vous connecter...</p>
    );
  }

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto font-sans bg-slate-50 min-h-screen">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-900">
          🛠️ Atelier : Suivi des Interventions
        </h1>
        <Button
          onClick={() => router.push("/appointments")}
          variant="primary"
          className="rounded-xl"
        >
          ➕ Nouveau Rendez-vous
        </Button>
      </div>

      {loading ? (
        <p className="text-slate-600">Mise à jour du planning...</p>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Client / Véhicule</th>
                <th className="px-4 py-3 text-left">Heure prévue</th>
                <th className="px-4 py-3 text-center">Statut</th>
                <th className="px-4 py-3 text-left">Action technique</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Aucun véhicule à l'agenda.
                  </td>
                </tr>
              ) : (
                appointments.map((app) => (
                  <tr
                    key={app.id}
                    className="border-b last:border-none border-slate-200"
                  >
                    <td className="px-4 py-4 align-top">
                      <div className="font-semibold text-slate-900">
                        {app.vehicle?.client?.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {app.vehicle?.make} {app.vehicle?.model} —{" "}
                        <span className="font-semibold">
                          {app.vehicle?.plateNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-700 align-top">
                      {new Date(app.scheduled_at).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-4 text-center align-top">
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                          app.intervention
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700",
                        ].join(" ")}
                      >
                        {app.intervention
                          ? app.intervention.status.toUpperCase()
                          : "ABSENT"}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      {!app.intervention ? (
                        <Button
                          variant="success"
                          onClick={() => startIntervention(app.id)}
                          className="font-bold"
                        >
                          📥 RÉCEPTIONNER LE VÉHICULE
                        </Button>
                      ) : (
                        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                          <textarea
                            placeholder="Notes techniques / Diagnostic..."
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
                            className="flex-1 min-h-[40px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                          <Button
                            variant="primary"
                            onClick={() => saveDiagnosis(app.intervention.id)}
                            title="Enregistrer le diagnostic"
                            className="px-3"
                          >
                            💾
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() =>
                              router.push(
                                `/create-proforma?interventionId=${app.intervention.id}`
                              )
                            }
                            className="whitespace-nowrap bg-amber-500 hover:bg-amber-600 border-none text-white font-bold"
                          >
                            🧾 CRÉER DEVIS
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
