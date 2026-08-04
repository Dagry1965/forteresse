'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { clientService, Client } from '@/services/clientService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Car,
  CreditCard,
  FileText,
  Pencil,
  Phone,
  Receipt,
  UserRound,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';
import { ClientContactsManager } from '@/components/clients/ClientContactsManager';

type ClientVehicle = {
  id: string;
  brand?: string;
  model?: string;
  registration?: string;
  status?: string;
};

type ClientAppointment = {
  id: string;
  date: string;
  status?: string;
  vehicle?: ClientVehicle;
};

type ClientProforma = {
  id: string;
  reference?: string;
  created_at: string;
  total?: number | string;
  status?: string;
};

type ClientRepairCase = {
  id: string;
  title?: string;
  status?: string;
  vehicle?: ClientVehicle;
  interventions?: Array<{ id: string }>;
  proformas?: ClientProforma[];
};

type ClientInvoice = {
  id: string;
  reference?: string;
  created_at: string;
  total?: number | string;
  status?: string;
};

type ClientPayment = {
  id: string;
  method?: string;
  created_at: string;
  amount?: number | string;
};

type ClientDetail = Client & {
  vehicles?: ClientVehicle[];
  appointments?: ClientAppointment[];
  cases?: ClientRepairCase[];
  invoices?: ClientInvoice[];
  payments?: ClientPayment[];
};

type ClientTab =
  | 'summary'
  | 'vehicles'
  | 'appointments'
  | 'cases'
  | 'proformas'
  | 'invoices'
  | 'payments'
  | 'contacts';

export default function ClientDetailPage() {
  const router = useRouter();
  const clientId = router.query.id as string;

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] =
    useState<ClientTab>('summary');

  const loadClient = async () => {
    if (!clientId) return;

    try {
      setLoading(true);
      const data = await clientService.getOne(clientId);
      setClient(data as ClientDetail);
    } catch (error: unknown) {
      console.error('Erreur chargement client', error);
      toast.error(
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string'
          ? (error as { message: string }).message
          : 'Erreur lors du chargement du client',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      loadClient();
    }
  }, [clientId]);

  const cases = client?.cases || [];
  const vehicles = client?.vehicles || [];
  const appointments = client?.appointments || [];
  const invoices = client?.invoices || [];
  const payments = client?.payments || [];
  const contacts = client?.contacts || [];

  const proformas = useMemo(
    () =>
      cases.flatMap((repairCase) =>
        (repairCase.proformas || []).map((proforma) => ({
          ...proforma,
          case: repairCase,
        })),
      ),
    [cases],
  );

  const financialSummary = useMemo(() => {
    const totalInvoiced = invoices.reduce(
      (sum, invoice) =>
        sum + Number(invoice.total || 0),
      0,
    );

    const totalPaid = payments.reduce(
      (sum, payment) =>
        sum + Number(payment.amount || 0),
      0,
    );

    return {
      totalInvoiced,
      totalPaid,
      remaining: Math.max(totalInvoiced - totalPaid, 0),
    };
  }, [invoices, payments]);

  if (loading) {
    return (
      <div className="p-10 text-xl text-slate-500">
        Chargement...
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-10 text-red-600">
        Client introuvable.
      </div>
    );
  }

  const displayName =
    client.type === 'COMPANY'
      ? client.company_name || client.name
      : client.name;

  const tabs: Array<{
    key: ClientTab;
    label: string;
    count?: number;
  }> = [
    { key: 'summary', label: 'Résumé' },
    { key: 'vehicles', label: 'Véhicules', count: vehicles.length },
    {
      key: 'appointments',
      label: 'Rendez-vous',
      count: appointments.length,
    },
    { key: 'cases', label: 'Dossiers', count: cases.length },
    {
      key: 'proformas',
      label: 'Proformas',
      count: proformas.length,
    },
    {
      key: 'invoices',
      label: 'Factures',
      count: invoices.length,
    },
    {
      key: 'payments',
      label: 'Paiements',
      count: payments.length,
    },
    {
      key: 'contacts',
      label: 'Contacts',
      count: contacts.length,
    },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
            {client.type === 'COMPANY' ? (
              <Building2 size={28} />
            ) : (
              <UserRound size={28} />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-black text-slate-900">
                {displayName}
              </h1>

              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-black uppercase">
                {client.type === 'COMPANY'
                  ? 'Entreprise'
                  : 'Particulier'}
              </span>
            </div>

            {client.type === 'COMPANY' && client.trade_name && (
              <p className="text-sm text-slate-500 mt-1">
                {client.trade_name}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/clients')}
          >
            <ArrowLeft size={16} className="mr-2" />
            Retour
          </Button>

          <Button
            onClick={() =>
              router.push(`/clients/${client.id}/edit`)
            }
          >
            <Pencil size={16} className="mr-2" />
            Modifier
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-2 opacity-70">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'summary' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <SummaryCard
              title="Véhicules"
              value={vehicles.length}
              icon={<Car size={22} />}
            />

            <SummaryCard
              title="Dossiers atelier"
              value={cases.length}
              icon={<Wrench size={22} />}
            />

            <SummaryCard
              title="Proformas"
              value={proformas.length}
              icon={<FileText size={22} />}
            />

            <SummaryCard
              title="Factures"
              value={invoices.length}
              icon={<Receipt size={22} />}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MoneyCard
              title="Total facturé"
              value={financialSummary.totalInvoiced}
            />

            <MoneyCard
              title="Total encaissé"
              value={financialSummary.totalPaid}
            />

            <MoneyCard
              title="Reste à payer"
              value={financialSummary.remaining}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="p-6 rounded-2xl">
              <h2 className="text-lg font-black mb-5">
                Informations du client
              </h2>

              <div className="space-y-4 text-sm">
                <InfoRow
                  label="Email"
                  value={client.email || '—'}
                />
                <InfoRow
                  label="Téléphone"
                  value={client.phone || '—'}
                />
                <InfoRow
                  label="Adresse"
                  value={client.address || '—'}
                />

                {client.type === 'COMPANY' && (
                  <>
                    <InfoRow
                      label="Numéro d'entreprise"
                      value={
                        client.registration_number || '—'
                      }
                    />
                    <InfoRow
                      label="Numéro de TVA"
                      value={client.vat_number || '—'}
                    />
                    <InfoRow
                      label="Adresse de facturation"
                      value={
                        client.billing_address || '—'
                      }
                    />
                    <InfoRow
                      label="Délai de paiement"
                      value={`${client.payment_terms_days || 0} jours`}
                    />
                    <InfoRow
                      label="Plafond de crédit"
                      value={
                        client.credit_limit !== null &&
                        client.credit_limit !== undefined
                          ? `${Number(
                              client.credit_limit,
                            ).toLocaleString('fr-FR')} €`
                          : '—'
                      }
                    />
                  </>
                )}
              </div>
            </Card>

            <Card className="p-6 rounded-2xl">
              <h2 className="text-lg font-black mb-5">
                Activité récente
              </h2>

              <div className="space-y-3">
                {cases.slice(0, 5).map((repairCase) => (
                  <button
                    key={repairCase.id}
                    type="button"
                    onClick={() => {
                      const interventionId =
                        repairCase.interventions?.[0]?.id;

                      if (interventionId) {
                        router.push(
                          `/workshop/case/${interventionId}`,
                        );
                      }
                    }}
                    className="w-full text-left p-4 rounded-xl border hover:bg-slate-50"
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-bold">
                          {repairCase.title ||
                            `Dossier ${repairCase.id.slice(-6)}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {repairCase.vehicle
                            ? `${repairCase.vehicle.brand} ${repairCase.vehicle.model}`
                            : 'Véhicule non renseigné'}
                        </p>
                      </div>

                      <span className="text-xs font-black text-blue-600">
                        {repairCase.status}
                      </span>
                    </div>
                  </button>
                ))}

                {cases.length === 0 && (
                  <EmptyState text="Aucun dossier atelier." />
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'vehicles' && (
        <DataSection
          title="Véhicules"
          emptyText="Aucun véhicule associé."
        >
          {vehicles.map((vehicle) => (
            <button
              key={vehicle.id}
              type="button"
              onClick={() =>
                router.push(`/vehicles/${vehicle.id}`)
              }
              className="w-full p-4 rounded-xl border text-left hover:bg-slate-50"
            >
              <p className="font-bold">
                {vehicle.brand} {vehicle.model}
              </p>
              <p className="text-sm text-slate-500">
                {vehicle.registration} · {vehicle.status}
              </p>
            </button>
          ))}
        </DataSection>
      )}

      {activeTab === 'appointments' && (
        <DataSection
          title="Rendez-vous"
          emptyText="Aucun rendez-vous."
        >
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="p-4 rounded-xl border"
            >
              <p className="font-bold">
                {new Date(appointment.date).toLocaleString(
                  'fr-FR',
                )}
              </p>
              <p className="text-sm text-slate-500">
                {appointment.vehicle
                  ? `${appointment.vehicle.brand} ${appointment.vehicle.model}`
                  : 'Véhicule non renseigné'}
                {' · '}
                {appointment.status}
              </p>
            </div>
          ))}
        </DataSection>
      )}

      {activeTab === 'cases' && (
        <DataSection
          title="Dossiers atelier"
          emptyText="Aucun dossier atelier."
        >
          {cases.map((repairCase) => {
            const interventionId =
              repairCase.interventions?.[0]?.id;

            return (
              <button
                key={repairCase.id}
                type="button"
                onClick={() => {
                  if (interventionId) {
                    router.push(
                      `/workshop/case/${interventionId}`,
                    );
                  }
                }}
                className="w-full p-4 rounded-xl border text-left hover:bg-slate-50"
              >
                <p className="font-bold">
                  {repairCase.title ||
                    `Dossier ${repairCase.id.slice(-6)}`}
                </p>
                <p className="text-sm text-slate-500">
                  {repairCase.vehicle
                    ? `${repairCase.vehicle.brand} ${repairCase.vehicle.model}`
                    : 'Véhicule non renseigné'}
                  {' · '}
                  {repairCase.status}
                </p>
              </button>
            );
          })}
        </DataSection>
      )}

      {activeTab === 'proformas' && (
        <DataSection
          title="Proformas"
          emptyText="Aucune proforma."
        >
          {proformas.map((proforma) => (
            <button
              key={proforma.id}
              type="button"
              onClick={() =>
                router.push(`/billing/proforma/${proforma.id}`)
              }
              className="w-full p-4 rounded-xl border text-left hover:bg-slate-50"
            >
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-bold">
                    {proforma.reference}
                  </p>
                  <p className="text-sm text-slate-500">
                    {new Date(
                      proforma.created_at,
                    ).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-black">
                    {Number(proforma.total || 0).toLocaleString(
                      'fr-FR',
                    )}{' '}
                    €
                  </p>
                  <p className="text-xs text-blue-600 font-bold">
                    {proforma.status}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </DataSection>
      )}

      {activeTab === 'invoices' && (
        <DataSection
          title="Factures"
          emptyText="Aucune facture."
        >
          {invoices.map((invoice) => (
            <button
              key={invoice.id}
              type="button"
              onClick={() =>
                router.push(
                  `/finance/invoices/print/${invoice.id}`,
                )
              }
              className="w-full p-4 rounded-xl border text-left hover:bg-slate-50"
            >
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-bold">
                    {invoice.reference}
                  </p>
                  <p className="text-sm text-slate-500">
                    {new Date(
                      invoice.created_at,
                    ).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-black">
                    {Number(invoice.total || 0).toLocaleString(
                      'fr-FR',
                    )}{' '}
                    €
                  </p>
                  <p className="text-xs text-blue-600 font-bold">
                    {invoice.status}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </DataSection>
      )}

      {activeTab === 'payments' && (
        <DataSection
          title="Paiements"
          emptyText="Aucun paiement."
        >
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="p-4 rounded-xl border"
            >
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-bold">
                    {payment.method}
                  </p>
                  <p className="text-sm text-slate-500">
                    {new Date(
                      payment.created_at,
                    ).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                <p className="font-black text-green-700">
                  {Number(payment.amount || 0).toLocaleString(
                    'fr-FR',
                  )}{' '}
                  €
                </p>
              </div>
            </div>
          ))}
        </DataSection>
      )}

      {activeTab === 'contacts' && (
        <Card className="p-6 rounded-2xl">
          <div className="mb-5">
            <h2 className="text-xl font-black">Contacts</h2>
            <p className="text-sm text-slate-500 mt-1">
              G\u00e9rez les interlocuteurs, le contact principal et les destinataires des documents.
            </p>
          </div>

          <ClientContactsManager
            clientId={client.id}
            contacts={contacts}
            onChanged={loadClient}
          />
        </Card>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="p-5 rounded-2xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase text-slate-400">
            {title}
          </p>
          <p className="text-3xl font-black mt-2">{value}</p>
        </div>

        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </Card>
  );
}

function MoneyCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <Card className="p-5 rounded-2xl">
      <p className="text-xs font-black uppercase text-slate-400">
        {title}
      </p>
      <p className="text-2xl font-black mt-2">
        {value.toLocaleString('fr-FR')} €
      </p>
    </Card>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between gap-6 border-b pb-3 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-right whitespace-pre-line">
        {value}
      </span>
    </div>
  );
}

function DataSection({
  title,
  emptyText,
  children,
}: {
  title: string;
  emptyText: string;
  children: React.ReactNode;
}) {
  const childrenArray = React.Children.toArray(children);

  return (
    <Card className="p-6 rounded-2xl">
      <h2 className="text-xl font-black mb-5">{title}</h2>

      <div className="space-y-3">
        {childrenArray.length > 0 ? (
          childrenArray
        ) : (
          <EmptyState text={emptyText} />
        )}
      </div>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="p-10 text-center text-sm text-slate-400 border border-dashed rounded-xl">
      {text}
    </div>
  );
}
