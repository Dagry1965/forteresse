import { useEffect, useState } from "react";
import { fetchVehicles, fetchEnterpriseVehicles } from "../lib/api";
import { CONFIG } from "../lib/config";

interface VehicleOption {
  id: string;
  make: string;
  model: string;
  plateNumber: string;
}

interface VehicleSelectorProps {
  companyId?: string;
  onSelect: (vehicleId: string) => void;
}

export default function VehicleSelector({
  companyId,
  onSelect,
}: VehicleSelectorProps) {
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);

  useEffect(() => {
    async function load() {
      const data = companyId
        ? await fetchEnterpriseVehicles(companyId)
        : await fetchVehicles(CONFIG.WORKSPACE_ID);

      setVehicles(data || []);
    }

    load();
  }, [companyId]);

  return (
    <select className="border p-2 rounded w-full mb-4" onChange={(e) => onSelect(e.target.value)}>
      <option value="">Sélectionner un véhicule</option>
      {vehicles.map((v) => (
        <option key={v.id} value={v.id}>
          {v.make} {v.model} ({v.plateNumber})
        </option>
      ))}
    </select>
  );
}



