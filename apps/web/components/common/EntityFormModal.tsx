'use client';

import React, { useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface EntityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;

  onSubmit: () => Promise<void> | void;
  isSubmitting?: boolean;

  submitLabel?: string;
  cancelLabel?: string;

  hideFooter?: boolean;
}

export function EntityFormModal({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Enregistrer',
  cancelLabel = 'Annuler',
  hideFooter = false,
}: EntityFormModalProps) {
  // 🔒 ESC + scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleSubmit = async () => {
    try {
      await onSubmit();
    } catch (err) {
      console.error('[EntityFormModal] submit error:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        !hideFooter && (
          <div className="flex justify-end gap-3 w-full">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {cancelLabel}
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'En cours...' : submitLabel}
            </Button>
          </div>
        )
      }
    >
      {children}
    </Modal>
  );
}