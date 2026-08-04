import { useEffect, useState } from "react";
import { API } from "../../../../lib/api";
import { CONFIG } from "../../../../lib/config";

type ProformaItem = {
  label: string;
  qty: number | string;
  unitPrice: number | string;
  total: number;
};

type Proforma = {
  id: string;
  items?: ProformaItem[];
};

type Intervention = {
  vehicle: {
    make?: string;
    model?: string;
    plateNumber?: string;
    client?: {
      name?: string;
    };
  };
  companyId?: string;
  appointment: {
    initialDescription?: string;
  };
};

type ApiError = {
  message?: string;
};

export default function ProformaPage() {
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [proforma, setProforma] = useState<Proforma | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const interventionId =
    typeof window !== "undefined"
      ? window.location.pathname.split("/")[4]
      : null;

  // Lignes de proforma
  const [items, setItems] = useState<ProformaItem[]>([]);

  async function load() {
    if (!interventionId) return;

    // Charger intervention
    const inter = await API.get<Intervention>(
      `${CONFIG.API_BASE}/api/interventions/${interventionId}`
    );
    setIntervention(inter);

    // Charger proforma existante
    const pf = await API.get<Proforma | null>(
      `${CONFIG.API_BASE}/api/finance/proforma/${interventionId}`
    );

    if (pf) {
      setProforma(pf);
      setItems(pf.items || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function addItem() {
    setItems([
      ...items,
      { label: "", qty: 1, unitPrice: 0, total: 0 }
    ]);
  }

  function updateItem(
    index: number,
    field: keyof Omit<ProformaItem, 'total'>,
    value: string,
  ) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    updated[index].total =
      Number(updated[index].qty) * Number(updated[index].unitPrice);

    setItems(updated);
  }

  async function saveProforma() {
    try {
      const payload = {
        interventionId,
        items,
      };

      if (!proforma) {
        // Création
        const created = await API.post<Proforma>(
          `${CONFIG.API_BASE}/api/finance/proforma`,
          payload
        );
        setProforma(created);
      } else {
        // Mise à jour
        const updated = await API.put<Proforma>(
          `${CONFIG.API_BASE}/api/finance/proforma/${proforma.id}`,
          payload
        );
        setProforma(updated);
      }

      setMessage("Proforma enregistrée !");
    } catch (error: unknown) {
      const apiError = error as ApiError;
      setMessage(apiError.message || 'Impossible d’enregistrer la proforma');
    }
  }

  async function approveProforma() {
    if (!proforma) return;

    try {
      await API.post(
        `${CONFIG.API_BASE}/api/finance/proforma/${proforma.id}/approve`
      );

      setMessage("Proforma validée ! L’intervention peut commencer.");

      // Redirection vers l’intervention
      setTimeout(() => {
        window.location.href = `/garage/intervention/${interventionId}`;
      }, 1000);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      setMessage(apiError.message || 'Impossible de valider la proforma');
    }
  }

  if (loading) return <p className="p-10">Chargement...</p>;
  if (!intervention) return <p className="p-10">Intervention introuvable.</p>;

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Proforma</h1>

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
      </div>

      {/* Lignes de proforma */}
      <div className="space-y-4 mb-6">
        {items.map((item, i) => (
          <div key={i} className="border p-4 rounded bg-white shadow-sm">
            <input
              type="text"
              placeholder="Libellé"
              className="border p-2 rounded w-full mb-2"
              value={item.label}
              onChange={(e) => updateItem(i, "label", e.target.value)}
            />

            <div className="flex gap-3">
              <input
                type="number"
                className="border p-2 rounded w-1/3"
                value={item.qty}
                onChange={(e) => updateItem(i, "qty", e.target.value)}
              />

              <input
                type="number"
                className="border p-2 rounded w-1/3"
                value={item.unitPrice}
                onChange={(e) => updateItem(i, "unitPrice", e.target.value)}
              />

              <input
                type="number"
                className="border p-2 rounded w-1/3 bg-gray-100"
                value={item.total}
                readOnly
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addItem}
        className="bg-gray-700 text-white px-4 py-2 rounded mb-4"
      >
        Ajouter une ligne
      </button>

      <br />

      <button
        onClick={saveProforma}
        className="bg-blue-600 text-white px-4 py-2 rounded mr-3"
      >
        Enregistrer
      </button>

      {proforma && (
        <button
          onClick={approveProforma}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Valider la proforma
        </button>
      )}

      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
