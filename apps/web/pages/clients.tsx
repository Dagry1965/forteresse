import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";

const WORKSPACE_ID = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971";

export default function ClientsPage() {
  const { token } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // État du type de client
  const [type, setType] = useState<"INDIVIDUAL" | "COMPANY">("INDIVIDUAL");

  // État pour le formulaire de création
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  
  // Nouveaux champs pour la gestion de flotte
  const [vatNumber, setVatNumber] = useState("");
  const [siret, setSiret] = useState("");
  const [contactPerson, setContactPerson] = useState("");

  const loadClients = async () => {
    try {
      const res = await apiFetch("/clients");
      const data = await res.json();
      console.log("Clients chargés :", data);
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur chargement clients", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadClients();
  }, [token]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/clients", {
        method: "POST",
        body: JSON.stringify({
          type, // INDIVIDUAL ou COMPANY
          name: newName,
          email: newEmail,
          phone: newPhone,
          vatNumber: type === "COMPANY" ? vatNumber : null,
          siret: type === "COMPANY" ? siret : null,
          contactPerson: type === "COMPANY" ? contactPerson : null,
          workspaceId: WORKSPACE_ID,
        }),
      });

      if (res.ok) {
        alert("✅ Client créé avec succès !");
        setNewName(""); setNewEmail(""); setNewPhone("");
        setVatNumber(""); setSiret(""); setContactPerson("");
        setType("INDIVIDUAL");
        loadClients();
      } else {
        const errData = await res.json();
        alert("Erreur : " + errData.message);
      }
    } catch (err) {
      alert("Erreur lors de la création");
    }
  };

  if (!token) {
    return (
      <p className="p-6 text-slate-600">Veuillez vous connecter...</p>
    );
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto font-sans">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">
        👥 Gestion de la Clientèle & Flottes
      </h1>

      {/* FORMULAIRE DE CRÉATION */}
      <section className="mb-8 rounded-xl border border-slate-200 bg-slate-50 px-5 py-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          ➕ Ajouter un nouveau client
        </h3>

        <form onSubmit={handleCreateClient} className="space-y-4">
          {/* SÉLECTEUR DE TYPE */}
          <div className="flex gap-2 p-1 bg-slate-200 rounded-lg w-fit">
            <button
              type="button"
              onClick={() => setType("INDIVIDUAL")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${type === "INDIVIDUAL" ? "bg-white shadow-sm text-sky-600" : "text-slate-600"}`}
            >
              Particulier
            </button>
            <button
              type="button"
              onClick={() => setType("COMPANY")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${type === "COMPANY" ? "bg-white shadow-sm text-sky-600" : "text-slate-600"}`}
            >
              Entreprise / Flotte
            </button>
          </div>

          {/* CHAMPS COMMUNS */}
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="text"
              placeholder={type === "COMPANY" ? "Raison Sociale" : "Nom complet"}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              className="flex-1 min-w-[180px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <input
              type="email"
              placeholder="Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1 min-w-[180px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <input
              type="text"
              placeholder="Téléphone"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="flex-1 min-w-[180px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* CHAMPS B2B (affichés uniquement pour COMPANY) */}
          {type === "COMPANY" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
              <input
                type="text"
                placeholder="N° TVA (optionnel)"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <input
                type="text"
                placeholder="SIRET (optionnel)"
                value={siret}
                onChange={(e) => setSiret(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <input
                type="text"
                placeholder="Gestionnaire / Contact"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" variant="primary" className="px-10">
              ENREGISTRER
            </Button>
          </div>
        </form>
      </section>

      {/* LISTE DES CLIENTS */}
      <h3 className="text-lg font-semibold text-slate-800 mb-3">
        📋 Liste des comptes enregistrés
      </h3>

      {loading ? (
        <p className="text-slate-500">Chargement des clients...</p>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-800 text-white text-left">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Nom / Raison Sociale</th>
                <th className="px-4 py-3">Contact Principal</th>
                <th className="px-4 py-3 text-center">Véhicules</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-4 text-center text-slate-500">Aucun client trouvé.</td></tr>
              ) : (
                clients.map((c) => (
                  <tr key={c.id} className="border-b last:border-none border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${c.type === 'COMPANY' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {c.type === 'COMPANY' ? 'FLOTTE' : 'PERSO'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      <div className="text-xs text-slate-500">{c.email || "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {c.type === 'COMPANY' ? (c.contactPerson || "Gérant") : (c.phone || "-")}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-800 font-medium">
                      {c.vehicles?.length || 0}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => (window.location.href = `/vehicles?clientId=${c.id}`)}
                        className="inline-flex items-center rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                      >
                        🚗 Gérer
                      </button>
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
