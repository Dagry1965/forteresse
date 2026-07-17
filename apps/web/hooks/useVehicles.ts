'use client';
import { useState, useEffect } from 'react';
import { vehicleService, Vehicle } from '@/services/vehicleService';

export function useVehicles(clientId?: string) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const data = clientId 
        ? await vehicleService.getByClient(clientId)
        : await vehicleService.getAll();
      setVehicles(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, [clientId]);
  return { vehicles, loading, refetch: fetchVehicles };
}