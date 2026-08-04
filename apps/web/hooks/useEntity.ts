import { useState, useEffect, useCallback } from 'react';

interface EntityService<T> {
  getAll: (workspaceId: string) => Promise<T[]>;
}

export function useEntity<T>(
  service: EntityService<T>,
  workspaceId?: string,
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!workspaceId) return;

    try {
      setLoading(true);
      const data = await service.getAll(workspaceId);
      setItems(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [service, workspaceId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    items,
    loading,
    error,
    refetch: load,
    setItems,
  };
}