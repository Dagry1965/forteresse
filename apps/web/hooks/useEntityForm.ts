'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface BaseEntity {
  id: string;
}

interface UseEntityFormOptions<T extends BaseEntity> {
  service: {
    create: (data: any) => Promise<any>;
    update: (id: string, data: any) => Promise<any>;
  };
  initialData: any;
  onSuccess?: (result?: any) => void | Promise<void>;
}

export function useEntityForm<T extends BaseEntity>({
  service,
  initialData,
  onSuccess,
}: UseEntityFormOptions<T>) {
  const [formData, setFormData] = useState<any>(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreate = useCallback(() => {
    setFormData(initialData);
    setIsEditing(false);
    setEditingId(null);
  }, [initialData]);

  const openEdit = useCallback((item: T) => {
    setFormData({ ...item });
    setIsEditing(true);
    setEditingId(item.id);
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialData);
    setIsEditing(false);
    setEditingId(null);
  }, [initialData]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);

    try {
      let result;

      if (isEditing && editingId) {
        result = await service.update(editingId, formData);
        toast.success('Modifié avec succès');
      } else {
        result = await service.create(formData);
        toast.success('Créé avec succès');
      }

      // 👉 Ton callback personnalisé est exécuté ici
      await onSuccess?.(result);

      resetForm();
      return result;
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Une erreur est survenue';

      toast.error(message);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isEditing, editingId, service, onSuccess, resetForm]);

  return {
    formData,
    setFormData,
    isEditing,
    isSubmitting,
    handleSubmit,
    openCreate,
    openEdit,
    resetForm,
  };
}
