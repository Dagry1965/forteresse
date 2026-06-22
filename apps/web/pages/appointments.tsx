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
import { Calendar, Clock } from "lucide-react";

const WORKSPACE_ID = "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971";

export default function AppointmentsPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const { vehicleId } = router.query;

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const resV = await apiFetch(`/api/vehicles?workspaceId=${WORKSPACE_ID}`);
      const dataV = await resV.json();
      setVehicles(Array.isArray(dataV) ? dataV : []);

      const resA = await apiFetch(
        `/api/appointments?workspaceId=${WORKSPACE_ID}`
      );
      const dataA = await resA.json();
      setAppointments(Array.isArray(dataA) ? dataA : []);

      if (vehicleId) setSelectedVehicle(vehicleId as string);
    } catch (err) {
      console.error("erreur chargement", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && router.isReady) loadData();
  }, [token, router.isReady, vehicleId]);

  const handlePlanify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          workspaceId: WORKSPACE_ID,
          vehicle_id: selectedVehicle,
          scheduled_at: date,
          initial_description: description,
          status: "planned",
          user_id: user?.id || "admin",
        }),
      });

      if (res.ok) {
        alert("ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ rendez-vous planifiÃƒÆ’Ã‚Â© !");
        loadData();
        setDate("");
        setDescription("");
      } else {
        const errorData = await res.json();
        alert(errorData.message || "erreur lors de la planification");
      }
    } catch (err) {
      alert("erreur de connexion au serveur");
    }
  };

  const handleStartIntervention = async (appointmentId: string) => {
    if (!confirm("voulez-vous dÃƒÆ’Ã‚Â©marrer les travaux pour ce vÃƒÆ’Ã‚Â©hicule ?")) return;

    try {
      const res = await apiFetch(
        `/api/interventions/from-appointment/${appointmentId}`,
        {
          method: "POST",
          body: JSON.stringify({
            workspaceId: WORKSPACE_ID,
            status: "diagnosing",
          }),
        }
      );

      if (res.ok) {
        alert("ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂºÃ‚Â  intervention dÃƒÆ’Ã‚Â©marrÃƒÆ’Ã‚Â©e. redirection vers l'atelier...");
        router.push("/workshop");
      } else {
        const errorData = await res.json();
        alert(errorData.message);
      }
    } catch (err) {
      alert("erreur lors de l'ouverture de l'intervention");
    }
  };

  if (!token) return null;

  return (
    <div className="flex flex-col gap-10 p-10 bg-[oklch(0.98_0_0)] min-h-screen font-sans">
      
      {/* HEADER PREMIUM */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-[oklch(0.22_0_0)] lowercase">
          rendez-vous
        </h1>
        <p className="text-[oklch(0.45_0_0)] font-medium text-sm">
          planification des entrÃƒÆ’Ã‚Â©es atelier et suivi de lÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢agenda
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 items-start">
        
        {/* COLONNE GAUCHE : FORMULAIRE */}
        <div className="xl:col-span-1">
          <Section title="nouveau rendez-vous">
            <form onSubmit={handlePlanify} className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase text-[oklch(0.45_0_0)] ml-1 tracking-widest">vÃƒÆ’Ã‚Â©hicule & client</span>
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  required
                  className="w-full bg-[oklch(0.98_0_0)] border border-[oklch(0.92_0_0)] rounded-2xl px-4 py-3 text-sm outline-none focus:border-[oklch(0.45_0_0)] transition-colors text-[oklch(0.22_0_0)]"
                >
                  <option value="">-- sÃƒÆ’Ã‚Â©lectionner --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.client?.name} ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â {v.make} {v.model} ({v.plateNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase text-[oklch(0.45_0_0)] ml-1 tracking-widest">date et heure</span>
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-[oklch(0.98_0_0)] border border-[oklch(0.92_0_0)] rounded-2xl px-4 py-3 text-sm outline-none focus:border-[oklch(0.45_0_0)] transition-colors text-[oklch(0.22_0_0)]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase text-[oklch(0.45_0_0)] ml-1 tracking-widest">motif de visite</span>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ex: rÃƒÆ’Ã‚Â©vision annuelle..."
                  required
                  className="w-full bg-[oklch(0.98_0_0)] border border-[oklch(0.92_0_0)] rounded-2xl px-4 py-3 text-sm outline-none focus:border-[oklch(0.45_0_0)] transition-colors text-[oklch(0.22_0_0)]"
                />
              </div>

              <Button type="submit" className="w-full rounded-2xl py-6 font-bold tracking-widest uppercase text-[10px]">
                enregistrer le rdv
              </Button>
            </form>
          </Section>
        </div>

        {/* COLONNE DROITE : PLANNING */}
        <div className="xl:col-span-2">
          <Section title="planning des arrivÃƒÆ’Ã‚Â©es">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left border-b border-[oklch(0.92_0_0)]">
                    <th className="pb-4 font-bold text-[oklch(0.45_0_0)] lowercase">date / heure</th>
                    <th className="pb-4 font-bold text-[oklch(0.45_0_0)] lowercase">vÃƒÆ’Ã‚Â©hicule</th>
                    <th className="pb-4 font-bold text-[oklch(0.45_0_0)] lowercase">motif</th>
                    <th className="pb-4 font-bold text-[oklch(0.45_0_0)] lowercase text-center">statut</th>
                    <th className="pb-4 font-bold text-[oklch(0.45_0_0)] lowercase text-right">action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[oklch(0.96_0_0)]">
                  {loading ? (
                    <tr><td colSpan={5} className="py-10 text-center animate-pulse text-[oklch(0.45_0_0)] lowercase">chargement de l'agenda...</td></tr>
                  ) : appointments.length === 0 ? (
                    <tr><td colSpan={5} className="py-10 text-center text-[oklch(0.45_0_0)] lowercase">aucun rendez-vous prÃƒÆ’Ã‚Â©vu.</td></tr>
                  ) : (
                    appointments.map((app) => (
                      <tr key={app.id} className="group hover:bg-[oklch(0.99_0_0)] transition-colors">
                        <td className="py-5">
                          <div className="flex items-center gap-2 font-bold text-[oklch(0.22_0_0)]">
                            <Clock className="w-3 h-3 text-[oklch(0.45_0_0)]" />
                            {new Date(app.scheduled_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                          </div>
                        </td>
                        <td className="py-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-[oklch(0.22_0_0)] lowercase">{app.vehicle?.make} {app.vehicle?.model}</span>
                            <span className="text-[10px] text-[oklch(0.45_0_0)] uppercase font-mono tracking-tighter">{app.vehicle?.plateNumber}</span>
                          </div>
                        </td>
                        <td className="py-5 text-[oklch(0.35_0_0)] lowercase text-xs">
                          {app.initial_description}
                        </td>
                        <td className="py-5 text-center">
                          <Badge variant={app.status === "planned" ? "individual" : "secondary"}>
                            {app.status === "planned" ? "confirmÃƒÆ’Ã‚Â©" : app.status}
                          </Badge>
                        </td>
                        <td className="py-5 text-right">
                          {app.status === "planned" && (
                            <button
                              onClick={() => handleStartIntervention(app.id)}
                              className="bg-[oklch(0.22_0_0)] text-white hover:bg-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                            >
                              dÃƒÆ’Ã‚Â©marrer
                            </button>
                          )}
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
    </div>
  );
}






