'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import {
  CalendarDays,
  Car,
  Gauge,
  Hash,
  Pencil,
  Trash2,
  UserRound,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Vehicle,
  vehicleService,
} from '@/services/vehicleService';
import { Button } from '@/components/ui/button';
import { appointmentService } from '@/services/appointmentService';
import { Card } from '@/components/ui/card';

type VehicleDetails = Vehicle & {
  appointments?: any[];
  cases?: any[];
};

function formatDate(value?: string | Date | null) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatMileage(value?: number | null) {
  if (value === null || value === undefined) {
    return '—';
  }

  return `${value.toLocaleString('fr-FR')} km`;
}

function statusLabel(status?: string) {
  const labels: Record<string, string> = {
    DISPONIBLE: 'Disponible',
    EN_REPARATION: 'En réparation',
    EN_ATTENTE_PIECES: 'En attente de pièces',
    VENDU: 'Vendu',
    HORS_SERVICE: 'Hors service',
    PENDING: 'En attente',
    CONFIRMED: 'Confirmé',
    COMPLETED: 'Terminé',
    CANCELLED: 'Annulé',
    RECEIVED: 'Reçu',
    DIAGNOSIS: 'Diagnostic',
    IN_PROGRESS: 'En cours',
  };

  return status ? labels[status] || status : '—';
}

export default function VehicleDetailPage() {
  const router = useRouter();
  const vehicleId = router.query.id as string;

  const [vehicle, setVehicle] =
    useState<VehicleDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [startingWorkshop, setStartingWorkshop] = useState(false);

  const loadVehicle = async () => {
    if (!vehicleId) {
      return;
    }

    try {
      setLoading(true);

      const data =
        await vehicleService.getOne(vehicleId);

      setVehicle(data as VehicleDetails);
    } catch (error: any) {
      console.error(
        'Erreur chargement véhicule',
        error,
      );

      toast.error(
        error?.message ||
          'Impossible de charger le véhicule',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vehicleId) {
      loadVehicle();
    }
  }, [vehicleId]);

  const appointments = vehicle?.appointments || [];
  const cases = vehicle?.cases || [];

  const interventions = useMemo(
    () =>
      cases.flatMap((repairCase: any) =>
        (repairCase.interventions || []).map(
          (intervention: any) => ({
            ...intervention,
            repairCase,
          }),
        ),
      ),
    [cases],
  );

  const nextAppointment = useMemo(() => {
    const now = Date.now();

    return [...appointments]
      .filter((appointment: any) => {
        const timestamp = new Date(
          appointment.date,
        ).getTime();

        return (
          Number.isFinite(timestamp) &&
          timestamp >= now &&
          appointment.status !== 'CANCELLED'
        );
      })
      .sort(
        (first: any, second: any) =>
          new Date(first.date).getTime() -
          new Date(second.date).getTime(),
      )[0];
  }, [appointments]);

  const handleStartWorkshop = async () => {
    if (!vehicle) {
      toast.error('Le v\u00e9hicule est introuvable.');
      return;
    }

    if (!nextAppointment?.id) {
      router.push(
        `/appointments?clientId=${clientId || ''}&vehicleId=${vehicle.id}`,
      );
      return;
    }

    try {
      setStartingWorkshop(true);

      const result = await appointmentService.startIntervention(
        nextAppointment.id,
      );

      toast.success(
        'Le v\u00e9hicule a \u00e9t\u00e9 envoy\u00e9 \u00e0 l\u2019atelier.',
      );

      const interventionId = result?.intervention?.id;

      if (interventionId) {
        router.push(`/garage/intervention/${interventionId}`);
        return;
      }

      await loadVehicle();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          'Impossible de d\u00e9marrer l\u2019intervention.',
      );
    } finally {
      setStartingWorkshop(false);
    }
  };

  const handleDelete = async () => {
    if (!vehicle) {
      return;
    }

    const confirmed = window.confirm(
      `Supprimer le véhicule "${vehicle.registration}" ?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      await vehicleService.delete(vehicle.id);

      toast.success(
        'Véhicule supprimé avec succès',
      );

      router.push('/vehicles');
    } catch (error: any) {
      toast.error(
        error?.message ||
          'Erreur lors de la suppression',
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-slate-500">
        Chargement du véhicule...
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold text-red-600">
          Véhicule introuvable
        </h1>

        <Button
          className="mt-4"
          onClick={() => router.push('/vehicles')}
        >
          Retour à la liste
        </Button>
      </div>
    );
  }

  const clientId =
    vehicle.client_id ||
    vehicle.clientId ||
    vehicle.client?.id;

  const clientName =
    vehicle.client?.company_name ||
    vehicle.client?.name ||
    'Client non renseigné';

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
            <Car size={32} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900">
                {vehicle.registration}
              </h1>

              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-black">
                {statusLabel(vehicle.status)}
              </span>
            </div>

            <p className="text-slate-500 mt-1">
              {vehicle.brand} {vehicle.model}
              {vehicle.year
                ? ` • ${vehicle.year}`
                : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/vehicles')}
          >
            Retour
          </Button>

          <Button
            onClick={() =>
              router.push(
                `/vehicles/${vehicle.id}/edit`,
              )
            }
          >
            <Pencil size={16} className="mr-2" />
            Modifier
          </Button>

          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 size={16} className="mr-2" />
            {deleting
              ? 'Suppression...'
              : 'Supprimer'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Rendez-vous"
          value={appointments.length}
          icon={<CalendarDays size={22} />}
        />

        <SummaryCard
          title="Dossiers atelier"
          value={cases.length}
          icon={<Wrench size={22} />}
        />

        <SummaryCard
          title="Interventions"
          value={interventions.length}
          icon={<Gauge size={22} />}
        />

        <SummaryCard
          title="Kilométrage"
          value={formatMileage(vehicle.mileage)}
          icon={<Hash size={22} />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="p-6 rounded-2xl xl:col-span-2">
          <h2 className="text-xl font-black mb-6">
            Informations du véhicule
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
            <InfoRow
              label="Immatriculation"
              value={vehicle.registration}
            />

            <InfoRow
              label="Marque"
              value={vehicle.brand}
            />

            <InfoRow
              label="Modèle"
              value={vehicle.model}
            />

            <InfoRow
              label="Année"
              value={
                vehicle.year
                  ? String(vehicle.year)
                  : '—'
              }
            />

            <InfoRow
              label="Kilométrage"
              value={formatMileage(vehicle.mileage)}
            />

            <InfoRow
              label="Statut"
              value={statusLabel(vehicle.status)}
            />

            <InfoRow
              label="Numéro de flotte"
              value={vehicle.fleet_number || '—'}
            />

            <InfoRow
              label="VIN"
              value={vehicle.vin || '—'}
            />

            <InfoRow
              label="Conducteur habituel"
              value={vehicle.usual_driver || '—'}
            />

            <InfoRow
              label="Centre de coût"
              value={vehicle.cost_center || '—'}
            />

            <InfoRow
              label="Service / département"
              value={vehicle.service_name || '—'}
            />
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 rounded-2xl">
            <h2 className="text-lg font-black mb-5">
              Client propriétaire
            </h2>

            <button
              type="button"
              disabled={!clientId}
              onClick={() => {
                if (clientId) {
                  router.push(`/clients/${clientId}`);
                }
              }}
              className="w-full flex items-center gap-4 p-4 rounded-xl border text-left hover:bg-slate-50 disabled:cursor-default"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center">
                <UserRound size={21} />
              </div>

              <div>
                <p className="font-bold text-slate-900">
                  {clientName}
                </p>

                <p className="text-xs text-slate-500">
                  Ouvrir la fiche client
                </p>
              </div>
            </button>
          </Card>

          <Card className="p-6 rounded-2xl">
            <h2 className="text-lg font-black mb-5">
              Actions rapides
            </h2>

            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={() =>
                  router.push(
                    `/appointments?clientId=${clientId || ''}&vehicleId=${vehicle.id}`,
                  )
                }
              >
                Prendre rendez-vous
              </Button>

              <Button
                variant="outline"
                className="w-full"
                disabled={startingWorkshop}
                onClick={handleStartWorkshop}
              >
                {startingWorkshop
                  ? 'D\u00e9marrage de l\u2019atelier...'
                  : nextAppointment
                    ? 'D\u00e9marrer l\u2019intervention'
                    : 'Planifier une intervention'}
              </Button>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl">
            <h2 className="text-lg font-black mb-4">
              Prochain rendez-vous
            </h2>

            {nextAppointment ? (
              <div className="rounded-xl border p-4">
                <p className="font-bold">
                  {formatDate(nextAppointment.date)}
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  {nextAppointment.time_slot?.start
                    ? new Date(
                        nextAppointment.time_slot.start,
                      ).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Horaire non renseigné'}
                </p>

                <p className="text-xs font-bold text-blue-600 mt-2">
                  {statusLabel(nextAppointment.status)}
                </p>
              </div>
            ) : (
              <EmptyState text="Aucun rendez-vous à venir." />
            )}
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="p-6 rounded-2xl">
          <h2 className="text-xl font-black mb-5">
            Historique des rendez-vous
          </h2>

          <div className="space-y-3">
            {appointments.slice(0, 8).map(
              (appointment: any) => (
                <div
                  key={appointment.id}
                  className="p-4 rounded-xl border"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-bold">
                        {formatDate(appointment.date)}
                      </p>

                      <p className="text-sm text-slate-500">
                        {appointment.time_slot?.start
                          ? new Date(
                              appointment.time_slot.start,
                            ).toLocaleTimeString(
                              'fr-FR',
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                              },
                            )
                          : 'Horaire non renseigné'}
                      </p>
                    </div>

                    <span className="text-xs font-black text-blue-600">
                      {statusLabel(
                        appointment.status,
                      )}
                    </span>
                  </div>
                </div>
              ),
            )}

            {appointments.length === 0 && (
              <EmptyState text="Aucun rendez-vous enregistré." />
            )}
          </div>
        </Card>

        <Card className="p-6 rounded-2xl">
          <h2 className="text-xl font-black mb-5">
            Historique atelier
          </h2>

          <div className="space-y-3">
            {cases.slice(0, 8).map(
              (repairCase: any) => {
                const intervention =
                  repairCase.interventions?.[0];

                return (
                  <button
                    key={repairCase.id}
                    type="button"
                    onClick={() => {
                      if (intervention?.id) {
                        router.push(
                          `/workshop/case/${intervention.id}`,
                        );
                      }
                    }}
                    className="w-full p-4 rounded-xl border text-left hover:bg-slate-50"
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-bold">
                          {repairCase.title ||
                            `Dossier ${repairCase.id.slice(-6)}`}
                        </p>

                        <p className="text-sm text-slate-500">
                          {formatDate(
                            repairCase.created_at,
                          )}
                          {' • '}
                          {repairCase.interventions?.length ||
                            0}{' '}
                          intervention(s)
                        </p>
                      </div>

                      <span className="text-xs font-black text-orange-600">
                        {statusLabel(
                          repairCase.status,
                        )}
                      </span>
                    </div>
                  </button>
                );
              },
            )}

            {cases.length === 0 && (
              <EmptyState text="Aucun dossier atelier." />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="p-5 rounded-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase text-slate-400">
            {title}
          </p>

          <p className="text-2xl font-black mt-2">
            {value}
          </p>
        </div>

        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          {icon}
        </div>
      </div>
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
    <div className="border-b pb-3">
      <p className="text-xs font-bold uppercase text-slate-400">
        {label}
      </p>

      <p className="font-semibold text-slate-900 mt-1 break-words">
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="p-8 text-center text-sm text-slate-400 border border-dashed rounded-xl">
      {text}
    </div>
  );
}
