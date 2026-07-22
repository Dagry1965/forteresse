import { useEffect, useState } from "react";
import { API } from "../../../../lib/api";
import { CONFIG } from "../../../../lib/config";

export default function InterventionPage() {
  const [intervention, setIntervention] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const interventionId =
    typeof window !== "undefined"
      ? window.location.pathname.split("/")[4]
      : null;

  // Lignes réelles
  const [parts, setParts] = useState<any[]>([]);
  const [labor, setLabor] = useState<any[]>([]);

  async function load() {
    if (!interventionId) return;

    try {
      const data = await API.get(
        `/api/workshop/interventions/${interventionId}`
      );

      setIntervention(data);
      setParts(data.parts || []);
      setLabor(data.labor || []);
    } catch (error: any) {
      console.error('Erreur chargement intervention', error);
      setMessage(
        error?.message || 'Impossible de charger l?intervention'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function addPart() {
    setParts([...parts, { label: "", qty: 1, unitPrice: 0 }]);
  }

  function updatePart(i: number, field: string, value: any) {
    const updated = [...parts];
    updated[i][field] = value;
    setParts(updated);
  }

  function addLabor() {
    setLabor([...labor, { label: "", hours: 1, rate: 0 }]);
  }

  function updateLabor(i: number, field: string, value: any) {
    const updated = [...labor];
    updated[i][field] = value;
    setLabor(updated);
  }

  async function saveIntervention() {
    try {
      await API.put(
        `${CONFIG.API_BASE}/api/interventions/${interventionId}`,
        {
          parts,
          labor,
          status: "in_progress",
        }
      );

      setMessage("Intervention mise à jour !");
    } catch (e: any) {
      setMessage(e.message);
    }
  }

  async function closeIntervention() {
    try {
      await API.post(
        `${CONFIG.API_BASE}/api/interventions/${interventionId}/close`
      );

      setMessage("Intervention clôturée ! Facture générée.");

      setTimeout(() => {
        window.location.href = `/garage/intervention/${interventionId}/invoice`;
      }, 1000);
    } catch (e: any) {
      setMessage(e.message);
    }
  }

  if (loading) return <p className="p-10">Chargement...</p>;

  if (!intervention) {
    return (
      <div className="p-10">
        <p className="text-red-600 font-semibold">
          {message || 'Intervention introuvable'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Intervention</h1>

      {/* Infos intervention */}
      <div className="border p-4 rounded bg-white shadow-sm mb-6">
        <p>
          <b>Véhicule :</b> {intervention.vehicle.make}{" "}
          {intervention.vehicle.model} ({intervention.vehicle.plateNumber})
        </p>

        <p>
          <b>Client :</b> {intervention.vehicle.client?.name}
        </p>

        <p>
          <b>Entreprise :</b>{" "}
          {intervention.companyId ? "Oui" : "Non"}
        </p>

        <p>
          <b>Description :</b> {intervention.appointment.initialDescription}
        </p>

        <p>
          <b>Statut :</b> {intervention.status}
        </p>
      </div>

      {/* Pièces utilisées */}
      <h2 className="text-xl font-semibold mb-3">Pièces utilisées</h2>
      <div className="space-y-4 mb-6">
        {parts.map((p, i) => (
          <div key={i} className="border p-4 rounded bg-white shadow-sm">
            <input
              type="text"
              placeholder="Libellé"
              className="border p-2 rounded w-full mb-2"
              value={p.label}
              onChange={(e) => updatePart(i, "label", e.target.value)}
            />

            <div className="flex gap-3">
              <input
                type="number"
                className="border p-2 rounded w-1/3"
                value={p.qty}
                onChange={(e) => updatePart(i, "qty", e.target.value)}
              />

              <input
                type="number"
                className="border p-2 rounded w-1/3"
                value={p.unitPrice}
                onChange={(e) => updatePart(i, "unitPrice", e.target.value)}
              />

              <input
                type="number"
                className="border p-2 rounded w-1/3 bg-gray-100"
                value={p.qty * p.unitPrice}
                readOnly
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addPart}
        className="bg-gray-700 text-white px-4 py-2 rounded mb-6"
      >
        Ajouter une pièce
      </button>

      {/* Main d’œuvre */}
      <h2 className="text-xl font-semibold mb-3">Main d’œuvre</h2>
      <div className="space-y-4 mb-6">
        {labor.map((l, i) => (
          <div key={i} className="border p-4 rounded bg-white shadow-sm">
            <input
              type="text"
              placeholder="Libellé"
              className="border p-2 rounded w-full mb-2"
              value={l.label}
              onChange={(e) => updateLabor(i, "label", e.target.value)}
            />

            <div className="flex gap-3">
              <input
                type="number"
                className="border p-2 rounded w-1/3"
                value={l.hours}
                onChange={(e) => updateLabor(i, "hours", e.target.value)}
              />

              <input
                type="number"
                className="border p-2 rounded w-1/3"
                value={l.rate}
                onChange={(e) => updateLabor(i, "rate", e.target.value)}
              />

              <input
                type="number"
                className="border p-2 rounded w-1/3 bg-gray-100"
                value={l.hours * l.rate}
                readOnly
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addLabor}
        className="bg-gray-700 text-white px-4 py-2 rounded mb-6"
      >
        Ajouter une ligne de main d’œuvre
      </button>

      {/* Actions */}
      <button
        onClick={saveIntervention}
        className="bg-blue-600 text-white px-4 py-2 rounded mr-3"
      >
        Enregistrer
      </button>

      <button
        onClick={closeIntervention}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Clôturer l’intervention
      </button>

      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
