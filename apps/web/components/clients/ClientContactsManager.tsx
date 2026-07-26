'use client';

import React, { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  ClientContact,
  clientService,
} from '@/services/clientService';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

type ContactForm = {
  first_name: string;
  last_name: string;
  role: string;
  email: string;
  phone: string;
  is_primary: boolean;
  receives_proforma: boolean;
  receives_invoice: boolean;
};

type Props = {
  clientId: string;
  contacts: ClientContact[];
  onChanged: () => Promise<void> | void;
};

const emptyForm: ContactForm = {
  first_name: '',
  last_name: '',
  role: '',
  email: '',
  phone: '',
  is_primary: false,
  receives_proforma: false,
  receives_invoice: false,
};

export function ClientContactsManager({
  clientId,
  contacts,
  onChanged,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingContact, setEditingContact] =
    useState<ClientContact | null>(null);
  const [form, setForm] = useState<ContactForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openCreate = () => {
    setEditingContact(null);
    setForm(emptyForm);
    setIsOpen(true);
  };

  const openEdit = (contact: ClientContact) => {
    setEditingContact(contact);
    setForm({
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      role: contact.role || '',
      email: contact.email || '',
      phone: contact.phone || '',
      is_primary: contact.is_primary,
      receives_proforma: contact.receives_proforma,
      receives_invoice: contact.receives_invoice,
    });
    setIsOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setIsOpen(false);
    setEditingContact(null);
    setForm(emptyForm);
  };

  const updateField = (
    field: keyof ContactForm,
    value: string | boolean,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error(
        'Le pr\u00e9nom et le nom du contact sont obligatoires.',
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        role: form.role.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        is_primary: form.is_primary,
        receives_proforma: form.receives_proforma,
        receives_invoice: form.receives_invoice,
      };

      if (editingContact) {
        await clientService.updateContact(
          clientId,
          editingContact.id,
          payload,
        );
        toast.success('Contact modifi\u00e9 avec succ\u00e8s.');
      } else {
        const workspaceId =
          localStorage.getItem('current_workspace_id');

        if (!workspaceId) {
          throw new Error(
            'Aucun workspace s\u00e9lectionn\u00e9.',
          );
        }

        await clientService.createContact(clientId, {
          workspaceId,
          ...payload,
        });
        toast.success('Contact ajout\u00e9 avec succ\u00e8s.');
      }

      closeModal();
      await onChanged();
    } catch (error: any) {
      console.error('Erreur enregistrement contact', error);
      toast.error(
        error?.message ||
          'Erreur lors de l\u2019enregistrement du contact.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contact: ClientContact) => {
    const confirmed = window.confirm(
      `Supprimer le contact ${contact.first_name} ${contact.last_name} ?`,
    );

    if (!confirmed) return;

    try {
      setDeletingId(contact.id);
      await clientService.deleteContact(clientId, contact.id);
      toast.success('Contact supprim\u00e9 avec succ\u00e8s.');
      await onChanged();
    } catch (error: any) {
      console.error('Erreur suppression contact', error);
      toast.error(
        error?.message ||
          'Erreur lors de la suppression du contact.',
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button type="button" onClick={openCreate}>
          <Plus size={16} className="mr-2" />
          Ajouter un contact
        </Button>
      </div>

      <div className="space-y-3">
        {contacts.length === 0 && (
          <div className="p-10 text-center text-sm text-slate-400 border border-dashed rounded-xl">
            Aucun contact enregistr\u00e9.
          </div>
        )}

        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="p-4 rounded-xl border"
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold">
                    {contact.first_name} {contact.last_name}
                  </p>

                  {contact.is_primary && (
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                      Principal
                    </span>
                  )}
                </div>

                <p className="text-sm text-slate-500 mt-1">
                  {contact.role || 'Contact'}
                </p>

                <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                  {contact.email && <span>{contact.email}</span>}
                  {contact.phone && <span>{contact.phone}</span>}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {contact.receives_proforma && (
                    <span className="px-2 py-1 rounded-lg bg-slate-100 text-xs font-semibold">
                      Re\u00e7oit les proformas
                    </span>
                  )}

                  {contact.receives_invoice && (
                    <span className="px-2 py-1 rounded-lg bg-slate-100 text-xs font-semibold">
                      Re\u00e7oit les factures
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openEdit(contact)}
                >
                  <Pencil size={15} className="mr-2" />
                  Modifier
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={deletingId === contact.id}
                  onClick={() => handleDelete(contact)}
                >
                  <Trash2 size={15} className="mr-2" />
                  {deletingId === contact.id
                    ? 'Suppression...'
                    : 'Supprimer'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        title={
          editingContact
            ? 'Modifier le contact'
            : 'Ajouter un contact'
        }
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              disabled={saving}
            >
              Annuler
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <ContactInput
            label="Pr\u00e9nom"
            value={form.first_name}
            required
            onChange={(value) =>
              updateField('first_name', value)
            }
          />

          <ContactInput
            label="Nom"
            value={form.last_name}
            required
            onChange={(value) =>
              updateField('last_name', value)
            }
          />

          <ContactInput
            label="Fonction"
            value={form.role}
            placeholder="Responsable de flotte, comptable..."
            onChange={(value) => updateField('role', value)}
          />

          <ContactInput
            label="Email"
            type="email"
            value={form.email}
            onChange={(value) => updateField('email', value)}
          />

          <ContactInput
            label="T\u00e9l\u00e9phone"
            value={form.phone}
            onChange={(value) => updateField('phone', value)}
          />

          <ContactCheckbox
            label="Contact principal"
            checked={form.is_primary}
            onChange={(checked) =>
              updateField('is_primary', checked)
            }
          />

          <ContactCheckbox
            label="Re\u00e7oit les proformas"
            checked={form.receives_proforma}
            onChange={(checked) =>
              updateField('receives_proforma', checked)
            }
          />

          <ContactCheckbox
            label="Re\u00e7oit les factures"
            checked={form.receives_invoice}
            onChange={(checked) =>
              updateField('receives_invoice', checked)
            }
          />
        </div>
      </Modal>
    </>
  );
}

function ContactInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-slate-700 mb-2">
        {label}
        {required ? ' *' : ''}
      </span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function ContactCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4"
      />
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>
    </label>
  );
}
