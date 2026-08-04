'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface BaseEntity {
  id: string;
}

interface UseEntityFormOptions<
  TEntity extends BaseEntity,
  TForm,
  TCreateData,
  TUpdateData,
  TResult extends BaseEntity,
> {
  service: {
    create: (data: TCreateData) => Promise<TResult>;
    update: (id: string, data: TUpdateData) => Promise<TResult>;
  };
  initialData: TForm;
  onSuccess?: (result?: TResult) => void | Promise<void>;
}

export function useEntityForm<
  TEntity extends BaseEntity,
  TForm,
  TCreateData,
  TUpdateData,
  TResult extends BaseEntity,
>({
  service,
  initialData,
  onSuccess,
}: UseEntityFormOptions<TEntity, TForm, TCreateData, TUpdateData, TResult>) {
  const [formData, setFormData] = useState<TForm>(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreate = useCallback(() => {
    setFormData(initialData);
    setIsEditing(false);
    setEditingId(null);
  }, [initialData]);

  const openEdit = useCallback((item: TEntity) => {
    setFormData({ ...item } as unknown as TForm);
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
        result = await service.update(
          editingId,
          formData as unknown as TUpdateData,
        );
        toast.success('Modifié avec succès');
      } else {
        result = await service.create(
          formData as unknown as TCreateData,
        );
        toast.success('Créé avec succès');
      }

      // 👉 Ton callback personnalisé est exécuté ici
      await onSuccess?.(result);

      resetForm();
      return result;
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Une erreur est survenue';

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
