import { useState, useEffect } from "react";
import { fetchAppointmentsByDate } from "../../lib/api";
import { CONFIG } from "../../lib/config";

export default function PlanningGarage() {
  const [date, setDate] = useState("");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!date) return;
    setLoading(true);

    const data = await fetchAppointmentsByDate(CONFIG.WORKSPACE_ID, date);
    setAppointments(data || []);

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [date]);

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Planning atelier</h1>

      {/* SÃ©lecteur de date */}
      <input
        type="date"
        className="border p-2 rounded mb-6"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      {loading && <p>Chargement...</p>}

      {!loading && appointments.length === 0 && date && (
        <p>Aucun rendez-vous pour cette date.</p>
      )}

      <div className="space-y-4">
        {appointments.map((a: any) => (
          <div key={a.id} className="border p-4 rounded shadow-sm bg-white">
            {/* Heure */}
            <p>
              <b>Heure :</b>{" "}
              {new Date(a.timeSlot.startTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>

            {/* VÃ©hicule */}
            <p>
              <b>VÃ©hicule :</b> {a.vehicle.make} {a.vehicle.model} (
              {a.vehicle.plateNumber})
            </p>

            {/* Client */}
            <p>
              <b>Client :</b> {a.vehicle.client?.name || "Particulier"}
            </p>

            {/* Entreprise */}
            <p>
              <b>Entreprise :</b>{" "}
              {a.companyId ? a.company?.name || "Entreprise" : "Non"}
            </p>

            {/* Statut */}
            <p>
              <b>Statut :</b> {a.status}
            </p>

            {/* Actions */}
            <div className="mt-3 flex gap-3">
              <button className="bg-green-600 text-white px-3 py-1 rounded">
                Confirmer
              </button>

              <button className="bg-red-600 text-white px-3 py-1 rounded">
                Annuler
              </button>

              <button
                className="bg-gray-700 text-white px-3 py-1 rounded"
                onClick={() =>
                  (window.location.href = `/garage/intervention/new?appointmentId=${a.id}`)
                }
              >
                Intervention
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

