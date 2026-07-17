'use client';
import { useState, useEffect } from 'react';
import { appointmentService } from '@/services/appointmentService';

export function useAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const all = await appointmentService.getAll();
      const pend = await appointmentService.getPending();
      setAppointments(all || []);
      setPending(pend || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);
  return { appointments, pending, loading, refetch: fetchAll };
}