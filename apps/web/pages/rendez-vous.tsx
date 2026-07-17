import { useState } from "react";
import { reserveAppointment } from "../lib/api";
import { CONFIG } from "../lib/config";
import TimeSlotPicker from "../components/rendezvous/TimeSlotPicker";
import VehicleSelector from "../components/VehicleSelector";
import DescriptionField from "../components/DescriptionField";

export default function RendezVousPublic() {
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  async function submit() {
    try {
      await reserveAppointment({
        workspaceId: CONFIG.WORKSPACE_ID,
        userId: "PUBLIC",
        vehicleId: vehicle,
        timeSlotId: slot,
        initialDescription: description,
        publicOrigin: true,
      });

      setMessage("Rendez-vous enregistrÃ© !");
    } catch (e: any) {
      setMessage(e.message);
    }
  }

  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Prendre un rendez-vous</h1>

      <input
        type="date"
        className="border p-2 rounded w-full mb-4"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <TimeSlotPicker date={date} onSelect={setSlot} />

      <VehicleSelector onSelect={setVehicle} />

      <DescriptionField value={description} onChange={setDescription} />

      <button onClick={submit} className="bg-blue-600 text-white px-4 py-2 rounded">
        RÃ©server
      </button>

      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}

