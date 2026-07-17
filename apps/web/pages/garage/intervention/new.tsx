import { useEffect, useState } from "react";
import { API } from "../../../lib/api";
import { CONFIG } from "../../../lib/config";

export default function NewInterventionPage() {
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Récupération du paramètre appointmentId
  const appointmentId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("appointmentId")
      : null;

  async function loadAppointment() {
    if (!appointmentId) return;

    const data = await API.get(
      `${CONFIG.API_BASE}/api/appointments/${appointmentId}`
    );

    setAppointment(data);
    setLoading(false);
  }

  async function createIntervention() {
    try {
      const intervention = await API.post(
        `${CONFIG.API_BASE}/api/interventions`,
        {
          appointmentId,
          vehicleId: appointment.vehicleId,
          clientId: appointment.vehicle.clientId,
          workspaceId: CONFIG.WORKSPACE_ID,
          status: "draft",
        }
      );

      // Redirection vers la page proforma
      window.location.href = `/garage/intervention/${intervention.id}/proforma`;
    } catch (e: any) {
      setMessage(e.message);
    }
  }

  useEffect(() => {
    loadAppointment();
  }, []);

  if (loading) return <p className="p-10">Chargement...</p>;

  if (!appointment)
    return <p className="p-10">Aucun rendez-vous trouvé.</p>;

  return (
    <div className="p-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Nouvelle intervention</h1>

      {/* Infos rendez-vous */}
      <div className="border p-4 rounded bg-white shadow-sm mb-6">
        <p>
          <b>Date :</b>{" "}
          {new Date(appointment.timeSlot.startTime).toLocaleString()}
        </p>

        <p>
          <b>Véhicule :</b> {appointment.vehicle.make}{" "}
          {appointment.vehicle.model} ({appointment.vehicle.plateNumber})
        </p>

        <p>
          <b>Client :</b> {appointment.vehicle.client?.name}
        </p>

        <p>
          <b>Entreprise :</b>{" "}
          {appointment.companyId ? "Oui" : "Non"}
        </p>

        <p>
          <b>Description :</b> {appointment.initialDescription}
        </p>
      </div>

      {/* Bouton créer intervention */}
      <button
        onClick={createIntervention}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Créer l’intervention
      </button>

      {message && <p className="mt-4 text-red-600">{message}</p>}
    </div>
  );
}
