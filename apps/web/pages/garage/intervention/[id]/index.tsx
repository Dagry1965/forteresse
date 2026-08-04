import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API } from "../../../../lib/api";
import { CONFIG } from "../../../../lib/config";
import { INTERVENTION_STATUS } from "../../../../../../shared/constants/status.constants";

type InterventionPart = {
  label: string;
  qty: number | string;
  unitPrice: number | string;
};

type LaborLine = {
  label: string;
  hours: number | string;
  rate: number | string;
};

type Vehicle = {
  make?: string;
  brand?: string;
  model?: string;
  plateNumber?: string;
  plate_number?: string;
  client?: {
    name?: string;
  };
};

type Intervention = {
  id: string;
  case_id?: string;
  case?: {
    id?: string;
    vehicle?: Vehicle;
    client?: {
      name?: string;
    };
  };
  vehicle?: Vehicle;
  client?: {
    name?: string;
  };
  appointment?: {
    initialDescription?: string;
  };
  description?: string;
  companyId?: string;
  status?: string;
  InterventionPart?: InterventionPart[];
  parts?: InterventionPart[];
  labor?: LaborLine[];
};

type ApiError = {
  message?: string;
};

export default function InterventionPage() {
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const router = useRouter();
  const interventionId =
    typeof router.query.id === "string" ? router.query.id : null;

  // Lignes réelles
  const [parts, setParts] = useState<InterventionPart[]>([]);
  const [labor, setLabor] = useState<LaborLine[]>([]);

  async function load() {
    if (!interventionId) return;

    try {
      const data = await API.get<Intervention>(
        `/api/workshop/interventions/${interventionId}`
      );

      const caseId = data.case_id || data.case?.id;

      if (caseId) {
        router.replace(`/workshop/case/${data.id}`);
        return;
      }

      setIntervention(data);
      setParts(data.InterventionPart || data.parts || []);
      setLabor(data.labor || []);
    } catch (error: unknown) {
      console.error('Erreur chargement intervention', error);
      const apiError = error as ApiError;
      setMessage(
        apiError.message || 'Impossible de charger l?intervention'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (router.isReady && interventionId) {
      load();
    }
  }, [router.isReady, interventionId]);

  function addPart() {
    setParts([...parts, { label: "", qty: 1, unitPrice: 0 }]);
  }

  function updatePart(
    i: number,
    field: keyof InterventionPart,
    value: string,
  ) {
    const updated = [...parts];
    updated[i] = { ...updated[i], [field]: value };
    setParts(updated);
  }

  function addLabor() {
    setLabor([...labor, { label: "", hours: 1, rate: 0 }]);
  }

  function updateLabor(
    i: number,
    field: keyof LaborLine,
    value: string,
  ) {
    const updated = [...labor];
    updated[i] = { ...updated[i], [field]: value };
    setLabor(updated);
  }

  async function saveIntervention() {
    try {
      await API.put(
        `${CONFIG.API_BASE}/api/interventions/${interventionId}`,
        {
          parts,
          labor,
          status: INTERVENTION_STATUS.IN_PROGRESS,
        }
      );

      setMessage("Intervention mise à jour !");
    } catch (error: unknown) {
      const apiError = error as ApiError;
      setMessage(apiError.message || 'Impossible de mettre ? jour l?intervention');
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
    } catch (error: unknown) {
      const apiError = error as ApiError;
      setMessage(apiError.message || 'Impossible de cl?turer l?intervention');
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

  const vehicle = intervention.case?.vehicle ?? intervention.vehicle;
  const client =
    intervention.case?.client ??
    vehicle?.client ??
    intervention.client;

  const description =
    intervention.description ??
    intervention.appointment?.initialDescription ??
    'Aucune description';

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Intervention</h1>

      {/* Infos intervention */}
      <div className="border p-4 rounded bg-white shadow-sm mb-6">
        <p>
          <b>Véhicule :</b> {vehicle
            ? `${vehicle.make || vehicle.brand || ''} ${vehicle.model || ''} (${vehicle.plateNumber || vehicle.plate_number || 'Sans immatriculation'})`
            : 'V?hicule non renseign?'}
        </p>

        <p>
          <b>Client :</b> {client?.name || 'Client non renseign?'}
        </p>

        <p>
          <b>Entreprise :</b>{" "}
          {intervention.companyId ? "Oui" : "Non"}
        </p>

        <p>
          <b>Description :</b> {description}
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
                value={Number(p.qty) * Number(p.unitPrice)}
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
                value={Number(l.hours) * Number(l.rate)}
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
