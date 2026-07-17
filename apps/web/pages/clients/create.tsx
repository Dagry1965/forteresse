'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientService } from '@/services/clientService';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function CreateClientPage() {
  const router = useRouter();

  const [type, setType] = useState<'INDIVIDUAL' | 'COMPANY'>('INDIVIDUAL');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [siret, setSiret] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Le nom est obligatoire');
      return;
    }

    try {
      setLoading(true);

      const workspaceId = localStorage.getItem('current_workspace_id');
      if (!workspaceId) {
        toast.error('Aucun workspace sélectionné');
        return;
      }

      const payload: any = {
        workspaceId,
        type,
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
      };

      if (type === 'COMPANY') {
        payload.siret = siret.trim() || null;
        payload.vatNumber = vatNumber.trim() || null;
        payload.contactPerson = contactPerson.trim() || null;
      }

      const created = await clientService.create(payload);

      toast.success('Client créé avec succès');
      router.push(`/clients/${created.id}`); // Redirection vers la page Détail
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Créer un client</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2">Type de client *</label>
          <select
            className="w-full border rounded-2xl px-4 py-3"
            value={type}
            onChange={(e) => setType(e.target.value as 'INDIVIDUAL' | 'COMPANY')}
          >
            <option value="INDIVIDUAL">Particulier</option>
            <option value="COMPANY">Entreprise</option>
          </select>
        </div>

        <input
          className="w-full border rounded-2xl px-4 py-3"
          placeholder="Nom / Raison sociale *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          className="w-full border rounded-2xl px-4 py-3"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full border rounded-2xl px-4 py-3"
          placeholder="Téléphone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        {type === 'COMPANY' && (
          <>
            <input
              className="w-full border rounded-2xl px-4 py-3"
              placeholder="SIRET"
              value={siret}
              onChange={(e) => setSiret(e.target.value)}
            />
            <input
              className="w-full border rounded-2xl px-4 py-3"
              placeholder="Numéro de TVA"
              value={vatNumber}
              onChange={(e) => setVatNumber(e.target.value)}
            />
            <input
              className="w-full border rounded-2xl px-4 py-3"
              placeholder="Contact principal"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
            />
          </>
        )}

        <div className="pt-4 flex gap-3">
          <Button type="submit" className="flex-1 py-4" disabled={loading}>
            {loading ? 'Création en cours...' : 'Créer le client'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1 py-4"
            onClick={() => router.push('/clients')}
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}