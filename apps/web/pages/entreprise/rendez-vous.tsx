import { useState } from "react";
import { reserveAppointment } from "../../lib/api";
import { CONFIG } from "../../lib/config";
import TimeSlotPicker from "../../components/rendezvous/TimeSlotPicker";
import VehicleSelector from "../../components/VehicleSelector";
import DescriptionField from "../../components/DescriptionField";

export default function RendezVousEntreprise() {
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  // ⚠️ À remplacer par les vraies valeurs
  const companyId =
    typeof window !== "undefined"
      ? localStorage.getItem("companyId") || "COMPANY_ID"
      : "COMPANY_ID";
  const userId =
    typeof window !== "undefined"
      ? localStorage.getItem("userId") || "MANAGER_ID"
      : "MANAGER_ID";

  async function submit() {
    try {
      await reserveAppointment({
        workspaceId: CONFIG.WORKSPACE_ID,
        userId,
        vehicleId: vehicle,
        timeSlotId: slot,
        date,
        initialDescription: description,
        companyId,
        publicOrigin: false, // ⚠️ IMPORTANT : entreprise
      });

      setMessage("Rendez-vous entreprise confirmé !");
    } catch (e: any) {
      setMessage(e.message);
    }
  }

  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Rendez-vous entreprise</h1>

      {/* Sélection date */}
      <input
        type="date"
        className="border p-2 rounded w-full mb-4"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      {/* Plages filtrées par companyId */}
      <TimeSlotPicker
        date={date}
        companyId={companyId}
        onSelect={setSlot}
      />

      {/* Véhicules de la flotte */}
      <VehicleSelector
        companyId={companyId}
        onSelect={setVehicle}
      />

      {/* Description */}
      <DescriptionField value={description} onChange={setDescription} />

      {/* Bouton */}
      <button
        onClick={submit}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Réserver
      </button>

      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}



