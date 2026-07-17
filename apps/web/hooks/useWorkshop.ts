'use client';
import { useState, useEffect } from 'react';
import { workshopService } from '@/services/workshopService';

export function useWorkshop() {
  const [interventions, setInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInterventions = async () => {
    try {
      setLoading(true);
      const data = await workshopService.getAll();
      setInterventions(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInterventions(); }, []);
  return { interventions, loading, refetch: fetchInterventions };
}