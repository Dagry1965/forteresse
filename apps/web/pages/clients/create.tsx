'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientService } from '@/services/clientService';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function getErrorMessage(error: unknown): string | undefined {
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }

  return undefined;
}

export default function CreateClientPage() {
  const router = useRouter();

  const [type, setType] = useState<'INDIVIDUAL' | 'COMPANY'>('INDIVIDUAL');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [address, setAddress] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [paymentTermsDays, setPaymentTermsDays] = useState('0');
  const [creditLimit, setCreditLimit] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const displayName =
      type === 'COMPANY'
        ? companyName.trim() || name.trim()
        : name.trim();

    if (!displayName) {
      toast.error(
        type === 'COMPANY'
          ? 'La raison sociale est obligatoire'
          : 'Le nom est obligatoire',
      );
      return;
    }

    try {
      setLoading(true);

      const workspaceId = localStorage.getItem('current_workspace_id');

      if (!workspaceId) {
        toast.error('Aucun workspace sélectionné');
        return;
      }

      const parsedPaymentTerms = Number(paymentTermsDays || 0);
      const parsedCreditLimit =
        creditLimit.trim() === '' ? undefined : Number(creditLimit);

      if (
        !Number.isInteger(parsedPaymentTerms) ||
        parsedPaymentTerms < 0
      ) {
        toast.error(
          'Le délai de paiement doit être un nombre entier positif',
        );
        return;
      }

      if (
        parsedCreditLimit !== undefined &&
        (!Number.isFinite(parsedCreditLimit) || parsedCreditLimit < 0)
      ) {
        toast.error(
          'Le plafond de crédit doit être un nombre positif',
        );
        return;
      }

      const payload = {
        workspaceId,
        type,
        name: displayName,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        company_name:
          type === 'COMPANY' ? companyName.trim() || undefined : undefined,
        trade_name:
          type === 'COMPANY' ? tradeName.trim() || undefined : undefined,
        registration_number:
          type === 'COMPANY'
            ? registrationNumber.trim() || undefined
            : undefined,
        vat_number:
          type === 'COMPANY' ? vatNumber.trim() || undefined : undefined,
        address: address.trim() || undefined,
        billing_address:
          type === 'COMPANY'
            ? billingAddress.trim() || undefined
            : undefined,
        payment_terms_days:
          type === 'COMPANY' ? parsedPaymentTerms : 0,
        credit_limit:
          type === 'COMPANY' ? parsedCreditLimit : undefined,
      };

      const created = await clientService.create(payload);

      toast.success('Client créé avec succès');
      router.push(`/clients/${created.id}`);
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error) || 'Erreur lors de la création du client',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Créer un client</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Type de client *
          </label>

          <select
            className="w-full border rounded-2xl px-4 py-3 bg-white"
            value={type}
            onChange={(e) =>
              setType(e.target.value as 'INDIVIDUAL' | 'COMPANY')
            }
          >
            <option value="INDIVIDUAL">Particulier</option>
            <option value="COMPANY">Entreprise</option>
          </select>
        </div>

        {type === 'INDIVIDUAL' ? (
          <div>
            <label className="block text-sm font-medium mb-2">
              Nom complet *
            </label>

            <input
              className="w-full border rounded-2xl px-4 py-3"
              placeholder="Nom et prénom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Raison sociale *
              </label>

              <input
                className="w-full border rounded-2xl px-4 py-3"
                placeholder="Raison sociale"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Nom commercial
              </label>

              <input
                className="w-full border rounded-2xl px-4 py-3"
                placeholder="Nom commercial"
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Email
            </label>

            <input
              type="email"
              className="w-full border rounded-2xl px-4 py-3"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Téléphone
            </label>

            <input
              className="w-full border rounded-2xl px-4 py-3"
              placeholder="Téléphone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Adresse
          </label>

          <textarea
            className="w-full border rounded-2xl px-4 py-3 min-h-[90px]"
            placeholder="Adresse principale"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        {type === 'COMPANY' && (
          <div className="space-y-5 rounded-2xl border bg-slate-50 p-5">
            <h2 className="text-lg font-bold text-slate-900">
              Informations de l'entreprise
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                className="w-full border rounded-2xl px-4 py-3 bg-white"
                placeholder="Numéro d'entreprise / SIRET / BCE / RCCM"
                value={registrationNumber}
                onChange={(e) =>
                  setRegistrationNumber(e.target.value)
                }
              />

              <input
                className="w-full border rounded-2xl px-4 py-3 bg-white"
                placeholder="Numéro de TVA"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
              />
            </div>

            <textarea
              className="w-full border rounded-2xl px-4 py-3 min-h-[90px] bg-white"
              placeholder="Adresse de facturation"
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Délai de paiement en jours
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  className="w-full border rounded-2xl px-4 py-3 bg-white"
                  value={paymentTermsDays}
                  onChange={(e) =>
                    setPaymentTermsDays(e.target.value)
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Plafond de crédit
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full border rounded-2xl px-4 py-3 bg-white"
                  placeholder="0"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 flex gap-3">
          <Button
            type="submit"
            className="flex-1 py-4"
            disabled={loading}
          >
            {loading
              ? 'Création en cours...'
              : 'Créer le client'}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="flex-1 py-4"
            onClick={() => router.push('/clients')}
            disabled={loading}
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
