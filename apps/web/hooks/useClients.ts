'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  clientService,
  type Client,
} from '@/services/clientService';

export function useClients() {
  const { user, isAuthenticated } = useAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceId = user?.memberships?.[0]?.workspace?.id;

  const fetchClients = useCallback(async () => {
    if (!workspaceId) {
      setClients([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await clientService.getAll(workspaceId);
      setClients(data ?? []);
    } catch (err: any) {
      console.error('Erreur chargement clients:', err);
      setError(
        err?.message || 'Erreur lors du chargement des clients',
      );
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (isAuthenticated && workspaceId) {
      void fetchClients();
    } else {
      setClients([]);
      setLoading(false);
    }
  }, [isAuthenticated, workspaceId, fetchClients]);

  return {
    clients,
    loading,
    error,
    refetch: fetchClients,
  };
}
