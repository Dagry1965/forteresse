'use client';
import { useState, useEffect } from 'react';
import { financeService } from '@/services/financeService';

export function useFinance() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUnpaid = async () => {
    try {
      setLoading(true);
      const data = await financeService.getUnpaidInvoices();
      setInvoices(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUnpaid(); }, []);
  return { invoices, loading, refetch: fetchUnpaid };
}