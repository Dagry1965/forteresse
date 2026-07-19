import { useState, useEffect } from "react";
import { API } from "../../lib/api";
import { CONFIG } from "../../lib/config";

export default function TimeSlotsPage() {
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  // Formulaire création plage
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [capacity, setCapacity] = useState(1);
  const [message, setMessage] = useState("");

  async function load() {
    if (!date) return;
    setLoading(true);

    const query = `${CONFIG.API_BASE}/api/time-slots?workspaceId=${CONFIG.WORKSPACE_ID}&date=${date}`;
    const data = await API.get(query);

    setSlots(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [date]);

  async function createSlot() {
    try {
      await API.post(`${CONFIG.API_BASE}/api/time-slots`, {
        workspaceId: CONFIG.WORKSPACE_ID,
        date,
        startTime: `${date}T${start}:00`,
        endTime: `${date}T${end}:00`,
        capacity: Number(capacity),
      });

      setMessage("Plage créée !");
      load();
    } catch (e: any) {
      setMessage(e.message);
    }
  }

  async function updateCapacity(id: string, newCapacity: number) {
    await API.put(`${CONFIG.API_BASE}/api/time-slots/${id}`, {
      capacity: newCapacity,
    });
    load();
  }

  async function closeSlot(id: string) {
    await API.put(`${CONFIG.API_BASE}/api/time-slots/${id}`, {
      status: "closed",
    });
    load();
  }

  return (
    <div className="p-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Gestion des plages horaires</h1>

      {/* Sélecteur de date */}
      <input
        type="date"
        className="border p-2 rounded mb-6"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      {/* Formulaire création plage */}
      <div className="border p-4 rounded mb-6 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-3">Créer une plage</h2>

        <div className="flex gap-3 mb-3">
          <input
            type="time"
            className="border p-2 rounded w-full"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
          <input
            type="time"
            className="border p-2 rounded w-full"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>

        <input
          type="number"
          min={1}
          className="border p-2 rounded w-full mb-3"
          value={capacity}
          onChange={(e) => setCapacity(Number(e.target.value))}
        />

        <button
          onClick={createSlot}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Ajouter la plage
        </button>

        {message && <p className="mt-3">{message}</p>}
      </div>

      {/* Liste des plages */}
      {loading && <p>Chargement...</p>}

      <div className="space-y-4">
        {slots.map((s: any) => (
          <div key={s.id} className="border p-4 rounded bg-white shadow-sm">
            <p>
              <b>Heure :</b>{" "}
              {new Date(s.startTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              →{" "}
              {new Date(s.endTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>

            <p>
              <b>Capacité :</b> {s.capacity}
            </p>

            <p>
              <b>Utilisé :</b> {s.used}
            </p>

            <p>
              <b>Statut :</b> {s.status}
            </p>

            <div className="flex gap-3 mt-3">
              {/* Modifier capacité */}
              <button
                className="bg-yellow-500 text-white px-3 py-1 rounded"
                onClick={() => updateCapacity(s.id, s.capacity + 1)}
              >
                + Capacité
              </button>

              <button
                className="bg-yellow-500 text-white px-3 py-1 rounded"
                onClick={() =>
                  s.capacity > 1 && updateCapacity(s.id, s.capacity - 1)
                }
              >
                - Capacité
              </button>

              {/* Fermer plage */}
              <button
                className="bg-red-600 text-white px-3 py-1 rounded"
                onClick={() => closeSlot(s.id)}
              >
                Fermer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

