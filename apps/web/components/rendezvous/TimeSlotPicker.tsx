import { useEffect, useState } from "react";
import { fetchTimeSlots } from "../../lib/api";
import { CONFIG } from "../../lib/config";

interface TimeSlotPickerProps {
  date: string;
  companyId?: string;
  onSelect: (slotId: string) => void;
}

export default function TimeSlotPicker({
  date,
  companyId,
  onSelect,
}: TimeSlotPickerProps) {
  const [slots, setSlots] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      if (!date) return;

      const data = await fetchTimeSlots({
        workspaceId: CONFIG.WORKSPACE_ID,
        date,
        companyId,
      });

      setSlots(data || []);
    }

    load();
  }, [date]);

  return (
    <select className="border p-2 rounded w-full mb-4" onChange={(e) => onSelect(e.target.value)}>
      <option value="">SÃ©lectionner une plage</option>
      {slots.map((s: any) => (
        <option key={s.id} value={s.id}>
          {new Date(s.startTime).toLocaleTimeString()} â†’ {new Date(s.endTime).toLocaleTimeString()}
        </option>
      ))}
    </select>
  );
}


