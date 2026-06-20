import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { apiFetch } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";

const WORKSPACE_ID = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971";

export default function AppointmentsPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const { vehicleId } = router.query;

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const resV = await apiFetch(`/api/vehicles?workspaceId=${WORKSPACE_ID}`);
      const dataV = await resV.json();
      setVehicles(Array.isArray(dataV) ? dataV : []);

      const resA = await apiFetch(
        `/api/appointments?workspaceId=${WORKSPACE_ID}`
      );
      const dataA = await resA.json();
      setAppointments(Array.isArray(dataA) ? dataA : []);

      if (vehicleId) setSelectedVehicle(vehicleId as string);
    } catch (err) {
      console.error("Erreur chargement", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && router.isReady) loadData();
  }, [token, router.isReady, vehicleId]);

  const handlePlanify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          workspaceId: WORKSPACE_ID,
          vehicle_id: selectedVehicle,
          scheduled_at: date,
          initial_description: description,
          status: "planned",
          user_id: user?.id || "admin",
        }),
      });

      if (res.ok) {
        alert("✅ Rendez-vous planifié !");
        loadData();
        setDate("");
        setDescription("");
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Erreur lors de la planification");
      }
    } catch (err) {
      alert("Erreur de connexion au serveur");
    }
  };

  const handleStartIntervention = async (appointmentId: string) => {
    if (!confirm("Voulez-vous démarrer les travaux pour ce véhicule ?")) return;

    try {
      const res = await apiFetch(
        `/api/interventions/from-appointment/${appointmentId}`,
        {
          method: "POST",
          body: JSON.stringify({
            workspaceId: WORKSPACE_ID,
            status: "diagnosing",
          }),
        }
      );

      if (res.ok) {
        alert("🛠 Intervention démarrée. Redirection vers l'atelier...");
        router.push("/workshop");
      } else {
        const errorData = await res.json();
        alert(errorData.message);
      }
    } catch (err) {
      alert("Erreur lors de l'ouverture de l'intervention");
    }
  };

  if (!token) {
    return (
      <p className="p-5 text-slate-600">Veuillez vous connecter...</p>
    );
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto font-sans bg-slate-50">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">
        📅 Gestion des Rendez-vous
      </h1>

      {/* FORMULAIRE NOUVEAU RDV */}
      <section className="mb-8 rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Nouveau Rendez-vous
        </h3>
        <form
          onSubmit={handlePlanify}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="md:col-span-2">
            <label className="block mb-1 text-sm font-medium text-slate-700">
              Véhicule & Client
            </label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">-- Sélectionner le véhicule --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.client?.name} — {v.make} {v.model} ({v.plateNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-slate-700">
              Date et heure
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-slate-700">
              Motif
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Freins bruyants..."
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="md:col-span-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full md:w-auto font-bold"
            >
              ENREGISTRER LE RENDEZ-VOUS
            </Button>
          </div>
        </form>
      </section>

      {/* PLANNING */}
      <h3 className="text-lg font-semibold text-slate-800 mb-3">
        📋 Planning des arrivées
      </h3>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Date / Heure</th>
              <th className="px-4 py-3 text-left">Véhicule</th>
              <th className="px-4 py-3 text-left">Motif</th>
              <th className="px-4 py-3 text-center">Statut</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-5 text-center text-slate-500"
                >
                  Aucun rendez-vous prévu.
                </td>
              </tr>
            ) : (
              appointments.map((app) => (
                <tr
                  key={app.id}
                  className="border-b last:border-none border-slate-100"
                >
                  <td className="px-4 py-3">
                    {new Date(app.scheduled_at).toLocaleString("fr-FR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">
                      {app.vehicle?.make} {app.vehicle?.model}
                    </div>
                    <div className="text-xs text-slate-500">
                      {app.vehicle?.plateNumber}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-800">
                    {app.initial_description}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                        app.status === "planned"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600",
                      ].join(" ")}
                    >
                      {app.status === "planned" ? "Confirmé" : app.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {app.status === "planned" && (
                      <button
                        onClick={() => handleStartIntervention(app.id)}
                        className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        🛠️ DÉMARRER TRAVAUX
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
