'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { vehicleService } from '@/services/vehicleService';
import { clientService } from '@/services/clientService';
import type { Client } from '@/services/clientService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

type VehicleFormData = {
  clientId: string;
  registration: string;
  brand: string;
  model: string;
  status: string;
  fleet_number: string;
  vin: string;
  year: string;
  mileage: string;
  usual_driver: string;
  cost_center: string;
  service_name: string;
};

const initialFormData: VehicleFormData = {
  clientId: '',
  registration: '',
  brand: '',
  model: '',
  status: 'DISPONIBLE',
  fleet_number: '',
  vin: '',
  year: '',
  mileage: '',
  usual_driver: '',
  cost_center: '',
  service_name: '',
};

export default function EditVehiclePage() {
  const router = useRouter();
  const vehicleId = router.query.id as string;

  const [formData, setFormData] =
    useState<VehicleFormData>(initialFormData);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    if (!vehicleId) return;

    try {
      setLoading(true);

      const workspaceId =
        localStorage.getItem('current_workspace_id');

      if (!workspaceId) {
        throw new Error(
          'Aucun workspace s?lectionn?',
        );
      }

      const [vehicle, clientsData] =
        await Promise.all([
          vehicleService.getOne(vehicleId),
          clientService.getAll(workspaceId),
        ]);

      setFormData({
        clientId:
          vehicle.clientId ||
          vehicle.client_id ||
          '',
        registration:
          vehicle.registration || '',
        brand:
          vehicle.brand || '',
        model:
          vehicle.model || '',
        status:
          vehicle.status || 'DISPONIBLE',
        fleet_number:
          vehicle.fleet_number || '',
        vin:
          vehicle.vin || '',
        year:
          vehicle.year === null ||
          vehicle.year === undefined
            ? ''
            : String(vehicle.year),
        mileage:
          vehicle.mileage === null ||
          vehicle.mileage === undefined
            ? ''
            : String(vehicle.mileage),
        usual_driver:
          vehicle.usual_driver || '',
        cost_center:
          vehicle.cost_center || '',
        service_name:
          vehicle.service_name || '',
      });

      setClients(clientsData || []);
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error, 'Erreur lors du chargement'),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vehicleId) {
      loadData();
    }
  }, [vehicleId]);

  const updateField = (
    field: keyof VehicleFormData,
    value: string,
  ) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    if (
      !formData.clientId ||
      !formData.registration.trim() ||
      !formData.brand.trim() ||
      !formData.model.trim()
    ) {
      toast.error(
        'Le client, l?immatriculation, la marque et le mod?le sont obligatoires.',
      );
      return;
    }

    const parsedYear =
      formData.year.trim() === ''
        ? undefined
        : Number(formData.year);

    const parsedMileage =
      formData.mileage.trim() === ''
        ? undefined
        : Number(formData.mileage);

    if (
      parsedYear !== undefined &&
      (
        !Number.isInteger(parsedYear) ||
        parsedYear < 1900 ||
        parsedYear > 2100
      )
    ) {
      toast.error(
        'L?ann?e du v?hicule est invalide.',
      );
      return;
    }

    if (
      parsedMileage !== undefined &&
      (
        !Number.isInteger(parsedMileage) ||
        parsedMileage < 0
      )
    ) {
      toast.error(
        'Le kilom?trage doit ?tre un entier positif.',
      );
      return;
    }

    try {
      setSaving(true);

      await vehicleService.update(
        vehicleId,
        {
          clientId: formData.clientId,
          registration:
            formData.registration.trim(),
          brand:
            formData.brand.trim(),
          model:
            formData.model.trim(),
          status:
            formData.status,
          fleet_number:
            formData.fleet_number.trim(),
          vin:
            formData.vin.trim(),
          year:
            parsedYear,
          mileage:
            parsedMileage,
          usual_driver:
            formData.usual_driver.trim(),
          cost_center:
            formData.cost_center.trim(),
          service_name:
            formData.service_name.trim(),
        },
      );

      toast.success(
        'V?hicule mis ? jour avec succ?s',
      );

      router.push(`/vehicles/${vehicleId}`);
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error, 'Erreur lors de la mise ? jour'),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10">
        Chargement...
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">
        Modifier le v?hicule
      </h1>

      <Card className="p-6 md:p-8">
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div>
            <label className="block text-sm font-medium mb-2">
              Client *
            </label>

            <select
              className="w-full border rounded-2xl px-4 py-3"
              value={formData.clientId}
              onChange={(event) =>
                updateField(
                  'clientId',
                  event.target.value,
                )
              }
              required
            >
              <option value="">
                -- S?lectionner un client --
              </option>

              {clients.map((client) => (
                <option
                  key={client.id}
                  value={client.id}
                >
                  {client.company_name ||
                    client.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Immatriculation *
              </label>

              <input
                className="w-full border rounded-2xl px-4 py-3"
                value={formData.registration}
                onChange={(event) =>
                  updateField(
                    'registration',
                    event.target.value,
                  )
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Statut
              </label>

              <select
                className="w-full border rounded-2xl px-4 py-3"
                value={formData.status}
                onChange={(event) =>
                  updateField(
                    'status',
                    event.target.value,
                  )
                }
              >
                <option value="DISPONIBLE">
                  Disponible
                </option>
                <option value="EN_REPARATION">
                  En r?paration
                </option>
                <option value="EN_ATTENTE_PIECES">
                  En attente de pi?ces
                </option>
                <option value="VENDU">
                  Vendu
                </option>
                <option value="HORS_SERVICE">
                  Hors service
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Marque *
              </label>

              <input
                className="w-full border rounded-2xl px-4 py-3"
                value={formData.brand}
                onChange={(event) =>
                  updateField(
                    'brand',
                    event.target.value,
                  )
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Mod?le *
              </label>

              <input
                className="w-full border rounded-2xl px-4 py-3"
                value={formData.model}
                onChange={(event) =>
                  updateField(
                    'model',
                    event.target.value,
                  )
                }
                required
              />
            </div>
          </div>

          <div className="rounded-2xl border bg-slate-50 p-5 space-y-4">
            <h2 className="text-lg font-bold">
              Informations de flotte
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                className="w-full border rounded-2xl px-4 py-3 bg-white"
                placeholder="Num?ro de flotte"
                value={formData.fleet_number}
                onChange={(event) =>
                  updateField(
                    'fleet_number',
                    event.target.value,
                  )
                }
              />

              <input
                className="w-full border rounded-2xl px-4 py-3 bg-white"
                placeholder="Num?ro VIN"
                value={formData.vin}
                onChange={(event) =>
                  updateField(
                    'vin',
                    event.target.value,
                  )
                }
              />

              <input
                type="number"
                min="1900"
                max="2100"
                className="w-full border rounded-2xl px-4 py-3 bg-white"
                placeholder="Ann?e"
                value={formData.year}
                onChange={(event) =>
                  updateField(
                    'year',
                    event.target.value,
                  )
                }
              />

              <input
                type="number"
                min="0"
                className="w-full border rounded-2xl px-4 py-3 bg-white"
                placeholder="Kilom?trage"
                value={formData.mileage}
                onChange={(event) =>
                  updateField(
                    'mileage',
                    event.target.value,
                  )
                }
              />

              <input
                className="w-full border rounded-2xl px-4 py-3 bg-white"
                placeholder="Conducteur habituel"
                value={formData.usual_driver}
                onChange={(event) =>
                  updateField(
                    'usual_driver',
                    event.target.value,
                  )
                }
              />

              <input
                className="w-full border rounded-2xl px-4 py-3 bg-white"
                placeholder="Centre de co?t"
                value={formData.cost_center}
                onChange={(event) =>
                  updateField(
                    'cost_center',
                    event.target.value,
                  )
                }
              />
            </div>

            <input
              className="w-full border rounded-2xl px-4 py-3 bg-white"
              placeholder="Service / d?partement"
              value={formData.service_name}
              onChange={(event) =>
                updateField(
                  'service_name',
                  event.target.value,
                )
              }
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={saving}
            >
              {saving
                ? 'Enregistrement...'
                : 'Enregistrer'}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() =>
                router.push(
                  `/vehicles/${vehicleId}`,
                )
              }
              disabled={saving}
            >
              Annuler
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
