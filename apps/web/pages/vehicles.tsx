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
import { useRouter } from "next/router";
import { apiFetch } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import Section from "../components/section";

const WORKSPACE_ID = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971";

export default function VehiclesPage() {
  const { token } = useAuth();
  const router = useRouter();
  const { clientId } = router.query;

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [driver, setDriver] = useState(""); // Nouvel ÃƒÆ’Ã‚Â©tat pour le conducteur (Flotte)
  const [loading, setLoading] = useState(true);

  const loadVehicles = async () => {
    try {
      const url = clientId ? `/vehicles?clientId=${clientId}` : "/vehicles";
      const res = await apiFetch(url);
      const data = await res.json();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("erreur chargement vÃƒÆ’Ã‚Â©hicules", err);
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
      alert("erreur : client non sÃƒÆ’Ã‚Â©lectionnÃƒÆ’Ã‚Â©.");
      return;
    }

    try {
      const res = await apiFetch("/vehicles", {
        method: "POST",
        body: JSON.stringify({
          make,
          model,
          plateNumber: plate,
          assignedDriver: driver, // Envoi du conducteur
          clientId,
          workspaceId: WORKSPACE_ID,
        }),
      });

      if (res.ok) {
        alert("ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ vÃƒÆ’Ã‚Â©hicule ajoutÃƒÆ’Ã‚Â© !");
        setMake(""); setModel(""); setPlate(""); setDriver("");
        loadVehicles();
      } else {
        const errorData = await res.json();
        alert("erreur : " + (errorData.message || res.statusText));
      }
    } catch (err) {
      alert("erreur lors de l'ajout du vÃƒÆ’Ã‚Â©hicule.");
    }
  };

  if (!token) return null;

  return (
    <div className="flex flex-col gap-10 p-10 bg-[oklch(0.98_0_0)] min-h-screen font-sans">
      
      {/* HEADER PREMIUM */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-[oklch(0.22_0_0)] lowercase">
          parc automobile
        </h1>
        <p className="text-[oklch(0.45_0_0)] font-medium">
          gestion des vÃƒÆ’Ã‚Â©hicules et conducteurs assignÃƒÆ’Ã‚Â©s
        </p>
      </div>

      <div className="flex flex-col gap-12">
        
        {/* FORMULAIRE D'AJOUT (Conditionnel) */}
        {clientId && (
          <Section title="ajouter un vÃƒÆ’Ã‚Â©hicule">
            <form onSubmit={handleCreate} className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-end">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase text-[oklch(0.45_0_0)] ml-1 tracking-widest">marque</span>
                <input
                  placeholder="ex: renault"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  required
                  className="w-full bg-[oklch(0.98_0_0)] border border-[oklch(0.92_0_0)] rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-[oklch(0.45_0_0)] transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase text-[oklch(0.45_0_0)] ml-1 tracking-widest">modÃƒÆ’Ã‚Â¨le</span>
                <input
                  placeholder="ex: master"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required
                  className="w-full bg-[oklch(0.98_0_0)] border border-[oklch(0.92_0_0)] rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-[oklch(0.45_0_0)] transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase text-[oklch(0.45_0_0)] ml-1 tracking-widest">plaque</span>
                <input
                  placeholder="aa-123-bb"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  required
                  className="w-full bg-[oklch(0.98_0_0)] border border-[oklch(0.92_0_0)] rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-[oklch(0.45_0_0)] transition-colors font-mono uppercase"
                />
              </div>
              <div className="flex flex-col gap-1 text-sky-600">
                <span className="text-[10px] font-bold uppercase ml-1 tracking-widest">conducteur</span>
                <input
                  placeholder="nom du salariÃƒÆ’Ã‚Â©"
                  value={driver}
                  onChange={(e) => setDriver(e.target.value)}
                  className="w-full bg-sky-50 border border-sky-100 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-sky-400 transition-colors"
                />
              </div>
              <Button type="submit" className="rounded-2xl py-5 font-bold uppercase text-[10px] tracking-widest">
                enregistrer
              </Button>
            </form>
          </Section>
        )}

        {/* LISTE DES VÃƒÆ’Ã¢â‚¬Â°HICULES */}
        <Section title="vÃƒÆ’Ã‚Â©hicules enregistrÃƒÆ’Ã‚Â©s">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left border-b border-[oklch(0.92_0_0)]">
                  <th className="pb-4 font-bold text-[oklch(0.45_0_0)] lowercase text-[11px] uppercase tracking-tighter">client</th>
                  <th className="pb-4 font-bold text-[oklch(0.45_0_0)] lowercase text-[11px] uppercase tracking-tighter">modÃƒÆ’Ã‚Â¨le</th>
                  <th className="pb-4 font-bold text-[oklch(0.45_0_0)] lowercase text-[11px] uppercase tracking-tighter text-center">plaque</th>
                  <th className="pb-4 font-bold text-[oklch(0.45_0_0)] lowercase text-[11px] uppercase tracking-tighter">conducteur</th>
                  <th className="pb-4 font-bold text-[oklch(0.45_0_0)] lowercase text-[11px] uppercase tracking-tighter text-right">action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[oklch(0.96_0_0)]">
                {loading ? (
                  <tr><td colSpan={5} className="py-10 text-center animate-pulse text-[oklch(0.45_0_0)] lowercase">chargement du parc...</td></tr>
                ) : vehicles.length === 0 ? (
                  <tr><td colSpan={5} className="py-10 text-center text-[oklch(0.45_0_0)] lowercase">aucun vÃƒÆ’Ã‚Â©hicule trouvÃƒÆ’Ã‚Â©.</td></tr>
                ) : (
                  vehicles.map((v) => (
                    <tr key={v.id} className="group hover:bg-[oklch(0.99_0_0)] transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <Badge variant={v.client?.type === 'COMPANY' ? 'company' : 'individual'}>
                            {v.client?.type === 'COMPANY' ? 'flotte' : 'perso'}
                          </Badge>
                          <span className="font-bold text-[oklch(0.22_0_0)] lowercase">{v.client?.name}</span>
                        </div>
                      </td>
                      <td className="py-4 text-[oklch(0.35_0_0)] lowercase font-medium">
                        {v.make} {v.model}
                      </td>
                      <td className="py-4 text-center">
                        <span className="font-mono font-bold text-[oklch(0.22_0_0)] uppercase bg-[oklch(0.96_0_0)] px-3 py-1 rounded-xl border border-[oklch(0.92_0_0)]">
                          {v.plateNumber}
                        </span>
                      </td>
                      <td className="py-4">
                        {v.assignedDriver ? (
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                            <span className="font-bold text-[oklch(0.22_0_0)] lowercase text-xs">{v.assignedDriver}</span>
                          </div>
                        ) : (
                          <span className="text-[oklch(0.6_0_0)] italic lowercase text-xs">non assignÃƒÆ’Ã‚Â©</span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => (window.location.href = `/appointments?vehicleId=${v.id}`)}
                          className="bg-[oklch(0.22_0_0)] text-white hover:bg-black px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                        >
                          rdv
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </div>
  );
}







