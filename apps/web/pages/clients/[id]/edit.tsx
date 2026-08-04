'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { clientService, Client } from '@/services/clientService';
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

export default function EditClientPage() {
  const router = useRouter();
  const clientId = router.query.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const loadClient = async () => {
    if (!clientId) return;

    try {
      setLoading(true);

      const data = await clientService.getOne(clientId);

      setClient(data);
      setName(data.name || '');
      setCompanyName(data.company_name || '');
      setTradeName(data.trade_name || '');
      setEmail(data.email || '');
      setPhone(data.phone || '');
      setRegistrationNumber(data.registration_number || '');
      setVatNumber(data.vat_number || '');
      setAddress(data.address || '');
      setBillingAddress(data.billing_address || '');
      setPaymentTermsDays(
        String(data.payment_terms_days ?? 0),
      );
      setCreditLimit(
        data.credit_limit === null ||
        data.credit_limit === undefined
          ? ''
          : String(data.credit_limit),
      );
    } catch (error: unknown) {
      console.error('Erreur chargement client', error);
      toast.error(
        getErrorMessage(error) || 'Erreur lors du chargement du client',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClient();
  }, [clientId]);

  const handleSave = async () => {
    if (!client) return;

    const displayName =
      client.type === 'COMPANY'
        ? companyName.trim() || name.trim()
        : name.trim();

    if (!displayName) {
      toast.error(
        client.type === 'COMPANY'
          ? 'La raison sociale est obligatoire'
          : 'Le nom est obligatoire',
      );
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
        'Le délai de paiement doit être un entier positif',
      );
      return;
    }

    if (
      parsedCreditLimit !== undefined &&
      (!Number.isFinite(parsedCreditLimit) ||
        parsedCreditLimit < 0)
    ) {
      toast.error(
        'Le plafond de crédit doit être un nombre positif',
      );
      return;
    }

    try {
      setSaving(true);

      await clientService.update(clientId, {
        name: displayName,
        email: email.trim(),
        phone: phone.trim(),
        company_name:
          client.type === 'COMPANY'
            ? companyName.trim()
            : undefined,
        trade_name:
          client.type === 'COMPANY'
            ? tradeName.trim()
            : undefined,
        registration_number:
          client.type === 'COMPANY'
            ? registrationNumber.trim()
            : undefined,
        vat_number:
          client.type === 'COMPANY'
            ? vatNumber.trim()
            : undefined,
        address: address.trim(),
        billing_address:
          client.type === 'COMPANY'
            ? billingAddress.trim()
            : undefined,
        payment_terms_days:
          client.type === 'COMPANY'
            ? parsedPaymentTerms
            : 0,
        credit_limit:
          client.type === 'COMPANY'
            ? parsedCreditLimit
            : undefined,
      });

      toast.success('Client mis à jour avec succès');
      router.push(`/clients/${clientId}`);
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error) || 'Erreur lors de la mise à jour',
      );
    } finally {
      setSaving(false);
    }
  };

  if (!clientId || loading) {
    return <div className="p-10">Chargement...</div>;
  }

  if (!client) {
    return (
      <div className="p-10 text-center text-red-600">
        Client introuvable.
      </div>
    );
  }

  return (
    <div className="p-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">
        Modifier le client
      </h1>

      <div className="space-y-6">
        {client.type === 'INDIVIDUAL' ? (
          <div>
            <label className="block text-sm font-medium mb-2">
              Nom complet *
            </label>

            <input
              className="w-full border rounded-2xl px-4 py-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom et prénom"
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
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Raison sociale"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Nom commercial
              </label>

              <input
                className="w-full border rounded-2xl px-4 py-3"
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                placeholder="Nom commercial"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="email"
            className="w-full border rounded-2xl px-4 py-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />

          <input
            className="w-full border rounded-2xl px-4 py-3"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Téléphone"
          />
        </div>

        <textarea
          className="w-full border rounded-2xl px-4 py-3 min-h-[90px]"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Adresse principale"
        />

        {client.type === 'COMPANY' && (
          <div className="space-y-5 rounded-2xl border bg-slate-50 p-5">
            <h2 className="text-lg font-bold">
              Informations de l'entreprise
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                className="w-full border rounded-2xl px-4 py-3 bg-white"
                value={registrationNumber}
                onChange={(e) =>
                  setRegistrationNumber(e.target.value)
                }
                placeholder="Numéro d'entreprise / SIRET / BCE / RCCM"
              />

              <input
                className="w-full border rounded-2xl px-4 py-3 bg-white"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                placeholder="Numéro de TVA"
              />
            </div>

            <textarea
              className="w-full border rounded-2xl px-4 py-3 min-h-[90px] bg-white"
              value={billingAddress}
              onChange={(e) =>
                setBillingAddress(e.target.value)
              }
              placeholder="Adresse de facturation"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="number"
                min="0"
                step="1"
                className="w-full border rounded-2xl px-4 py-3 bg-white"
                value={paymentTermsDays}
                onChange={(e) =>
                  setPaymentTermsDays(e.target.value)
                }
                placeholder="Délai de paiement"
              />

              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full border rounded-2xl px-4 py-3 bg-white"
                value={creditLimit}
                onChange={(e) =>
                  setCreditLimit(e.target.value)
                }
                placeholder="Plafond de crédit"
              />
            </div>
          </div>
        )}

        <Button
          className="w-full py-4"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>

        <Button
          variant="outline"
          className="w-full py-4"
          onClick={() => router.push(`/clients/${clientId}`)}
          disabled={saving}
        >
          Retour
        </Button>
      </div>
    </div>
  );
}
