import React, { useEffect, useState } from "react";
import { EmptyState } from '../components/ui/empty-state';
import { Tabs } from '../components/ui/tabs';
import { Alert } from '../components/ui/alert';
import { TextareaField } from '../components/ui/textarea-field';
import { SelectField } from '../components/ui/select-field';
import { ResponsiveGrid } from '../components/ui/responsive-grid';
import { DataTable } from '../components/ui/data-table';
import { DateField } from '../components/ui/date-field';
import { TextField } from '../components/ui/text-field';
import { apiFetch } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import Section from "../components/section";

const WORKSPACE_ID = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971";

export default function ClientsPage() {
  const { token } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ÃƒÆ’Ã¢â‚¬Â°tat du type de client
  const [type, setType] = useState<"INDIVIDUAL" | "COMPANY">("INDIVIDUAL");

  // ÃƒÆ’Ã¢â‚¬Â°tat pour le formulaire de crÃƒÆ’Ã‚Â©ation
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
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("erreur chargement clients", err);
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
          type, 
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
        setNewName(""); setNewEmail(""); setNewPhone("");
        setVatNumber(""); setSiret(""); setContactPerson("");
        setType("INDIVIDUAL");
        loadClients();
      } else {
        const errData = await res.json();
        alert("erreur : " + errData.message);
      }
    } catch (err) {
      alert("erreur lors de la crÃƒÆ’Ã‚Â©ation");
    }
  };

  if (!token) return null;

  return (
    <div className="flex flex-col gap-10 p-10 bg-[oklch(0.98_0_0)] min-h-screen font-sans">
      
      {/* HEADER PREMIUM */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-[oklch(0.22_0_0)] lowercase">
          gestion clientÃƒÆ’Ã‚Â¨le
        </h1>
        <p className="text-[oklch(0.45_0_0)] font-medium">
          comptes particuliers et flottes dÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢entreprise
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 items-start">
        
        {/* COLONNE GAUCHE : FORMULAIRE */}
        <div className="xl:col-span-1">
          <Section title="ajouter un client">
            <form onSubmit={handleCreateClient} className="flex flex-col gap-6">
              
              {/* TOGGLE TYPE PREMIUM */}
              <div className="flex gap-2 p-1 bg-[oklch(0.96_0_0)] rounded-2xl w-full font-bold">
                <button
                  type="button"
                  onClick={() => setType("INDIVIDUAL")}
                  className={`flex-1 py-2 rounded-xl text-[10px] uppercase transition-all ${type === "INDIVIDUAL" ? "bg-white shadow-sm text-[oklch(0.22_0_0)]" : "text-[oklch(0.45_0_0)]"}`}
                >
                  particulier
                </button>
                <button
                  type="button"
                  onClick={() => setType("COMPANY")}
                  className={`flex-1 py-2 rounded-xl text-[10px] uppercase transition-all ${type === "COMPANY" ? "bg-white shadow-sm text-[oklch(0.22_0_0)]" : "text-[oklch(0.45_0_0)]"}`}
                >
                  entreprise
                </button>
              </div>

              {/* INPUTS DÃƒÆ’Ã¢â‚¬Â°SIGNATION */}
              <div className="flex flex-col gap-4">
                <input
                  placeholder={type === "COMPANY" ? "raison sociale" : "nom complet"}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full bg-[oklch(0.98_0_0)] border border-[oklch(0.92_0_0)] rounded-2xl px-4 py-3 text-sm outline-none focus:border-[oklch(0.45_0_0)] transition-colors text-[oklch(0.22_0_0)]"
                />
                <input
                  type="email"
                  placeholder="adresse email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-[oklch(0.98_0_0)] border border-[oklch(0.92_0_0)] rounded-2xl px-4 py-3 text-sm outline-none focus:border-[oklch(0.45_0_0)] transition-colors text-[oklch(0.22_0_0)]"
                />
                <input
                  placeholder="tÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©phone"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-[oklch(0.98_0_0)] border border-[oklch(0.92_0_0)] rounded-2xl px-4 py-3 text-sm outline-none focus:border-[oklch(0.45_0_0)] transition-colors text-[oklch(0.22_0_0)]"
                />

                {type === "COMPANY" && (
                  <div className="flex flex-col gap-4 pt-2 border-t border-[oklch(0.96_0_0)]">
                    <input
                      placeholder="numÃƒÆ’Ã‚Â©ro de tva"
                      value={vatNumber}
                      onChange={(e) => setVatNumber(e.target.value)}
                      className="w-full bg-[oklch(0.98_0_0)] border border-[oklch(0.92_0_0)] rounded-2xl px-4 py-3 text-sm outline-none focus:border-[oklch(0.45_0_0)] transition-colors font-mono"
                    />
                    <input
                      placeholder="siiret"
                      value={siret}
                      onChange={(e) => setSiret(e.target.value)}
                      className="w-full bg-[oklch(0.98_0_0)] border border-[oklch(0.92_0_0)] rounded-2xl px-4 py-3 text-sm outline-none focus:border-[oklch(0.45_0_0)] transition-colors font-mono"
                    />
                    <input
                      placeholder="gestionnaire de flotte"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="w-full bg-[oklch(0.98_0_0)] border border-[oklch(0.92_0_0)] rounded-2xl px-4 py-3 text-sm outline-none focus:border-[oklch(0.45_0_0)] transition-colors"
                    />
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full rounded-2xl py-6 font-bold tracking-widest uppercase text-[10px]">
                enregistrer le client
              </Button>
            </form>
          </Section>
        </div>

        {/* COLONNE DROITE : LISTE */}
        <div className="xl:col-span-2">
          <Section title="comptes enregistrÃƒÆ’Ã‚Â©s">
            <div className="flex flex-col gap-4">
              {loading ? (
                <div className="text-center py-10 animate-pulse text-[oklch(0.45_0_0)] lowercase">chargement de la base clientÃƒÆ’Ã‚Â¨le...</div>
              ) : clients.length === 0 ? (
                <div className="text-[oklch(0.45_0_0)] text-sm lowercase text-center py-10">aucun compte trouvÃƒÆ’Ã‚Â©.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="text-left border-b border-[oklch(0.92_0_0)]">
                        <th className="pb-4 font-bold text-[oklch(0.45_0_0)] lowercase">type</th>
                        <th className="pb-4 font-bold text-[oklch(0.45_0_0)] lowercase">nom / raison sociale</th>
                        <th className="pb-4 font-bold text-[oklch(0.45_0_0)] lowercase">contact</th>
                        <th className="pb-4 font-bold text-[oklch(0.45_0_0)] lowercase text-center">parc</th>
                        <th className="pb-4 font-bold text-[oklch(0.45_0_0)] lowercase text-right">actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[oklch(0.96_0_0)]">
                      {clients.map((c) => (
                        <tr key={c.id} className="group hover:bg-[oklch(0.99_0_0)] transition-colors">
                          <td className="py-4">
                            <Badge variant={c.type === 'COMPANY' ? 'company' : 'individual'}>
                              {c.type === 'COMPANY' ? 'flotte' : 'perso'}
                            </Badge>
                          </td>
                          <td className="py-4">
                            <div className="font-bold text-[oklch(0.22_0_0)] lowercase">{c.name}</div>
                            <div className="text-xs text-[oklch(0.45_0_0)]">{c.email || '-'}</div>
                          </td>
                          <td className="py-4 text-[oklch(0.35_0_0)]">
                            {c.type === 'COMPANY' ? (c.contactPerson || "non dÃƒÆ’Ã‚Â©fini") : (c.phone || "-")}
                          </td>
                          <td className="py-4 text-center font-bold text-[oklch(0.22_0_0)]">
                            {c.vehicles?.length || 0}
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => (window.location.href = `/vehicles?clientId=${c.id}`)}
                              className="bg-[oklch(0.96_0_0)] hover:bg-[oklch(0.22_0_0)] hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all"
                            >
                              gÃƒÆ’Ã‚Â©rer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Section>
        </div>

      </div>
    </div>
  );
}







