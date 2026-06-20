import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { apiFetch } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";

const WORKSPACE_ID = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971";

export default function VehiclesPage() {
  const { token } = useAuth();
  const router = useRouter();
  const { clientId } = router.query;

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [loading, setLoading] = useState(true);

  const loadVehicles = async () => {
    try {
      const url = clientId ? `/vehicles?clientId=${clientId}` : "/vehicles";
      const res = await apiFetch(url);
      const data = await res.json();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur chargement véhicules", err);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && router.isReady) loadVehicles();
  }, [token, router.isReady, clientId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      alert(
        "Erreur: Le client n'est pas sélectionné. Rechargez la page depuis la liste des clients."
      );
      return;
    }

    try {
      const res = await apiFetch("/vehicles", {
        method: "POST",
        body: JSON.stringify({
          make,
          model,
          plateNumber: plate,
          clientId,
          workspaceId: WORKSPACE_ID,
        }),
      });

      if (res.ok) {
        alert("✅ Véhicule ajouté !");
        setMake("");
        setModel("");
        setPlate("");
        loadVehicles();
      } else {
        const errorData = await res.json();
        alert("Erreur: " + (errorData.message || res.statusText));
      }
    } catch (err) {
      alert("Erreur lors de l'ajout du véhicule.");
    }
  };

  if (!token) {
    return (
      <p className="p-6 text-slate-600">Connexion requise...</p>
    );
  }

  if (loading) {
    return (
      <p className="p-6 text-slate-600">Chargement des véhicules...</p>
    );
  }

  return (
    <div className="px-6 py-8 font-sans">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">
        🚗 Gestion des Véhicules
      </h1>

      {clientId && (
        <section className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">
            ➕ Ajouter un véhicule pour ce client
          </h3>
          <form
            onSubmit={handleCreate}
            className="flex flex-wrap gap-3 items-center"
          >
            <input
              placeholder="Marque"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              required
              className="flex-1 min-w-[160px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <input
              placeholder="Modèle"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              required
              className="flex-1 min-w-[160px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <input
              placeholder="Plaque d'immatriculation"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              required
              className="flex-1 min-w-[180px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <Button type="submit" variant="primary" className="px-4">
              Ajouter
            </Button>
          </form>
        </section>
      )}

      <h3 className="text-lg font-semibold text-slate-800 mb-3">
        📋 Liste des véhicules
      </h3>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left">Client</th>
              <th className="px-4 py-3 text-left">Marque</th>
              <th className="px-4 py-3 text-left">Modèle</th>
              <th className="px-4 py-3 text-left">Plaque</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-4 text-center text-slate-500"
                >
                  Aucun véhicule trouvé pour ce client.
                </td>
              </tr>
            ) : (
              vehicles.map((v) => (
                <tr
                  key={v.id}
                  className="border-b last:border-none border-slate-100"
                >
                  <td className="px-4 py-3 text-slate-800">
                    {v.client?.name}
                  </td>
                  <td className="px-4 py-3 text-slate-800">{v.make}</td>
                  <td className="px-4 py-3 text-slate-800">{v.model}</td>
                  <td className="px-4 py-3 text-slate-800">
                    {v.plateNumber}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        (window.location.href = `/appointments?vehicleId=${v.id}`)
                      }
                      className="inline-flex items-center rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
                    >
                      📅 RDV
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <a
          href="/clients"
          className="text-sky-600 hover:text-sky-700 text-sm font-medium"
        >
          ⬅ Retour aux clients
        </a>
      </div>
    </div>
  );
}
