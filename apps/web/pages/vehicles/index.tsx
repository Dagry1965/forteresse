'use client';

import React, { useState } from "react";
import { vehicleService } from "@/services/vehicleService";
import type { Vehicle } from "@/services/vehicleService";
import { clientService } from "@/services/clientService";
import type { Client } from "@/services/clientService";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { DataTable, Column } from "@/components/ui/data-table";
import { toast } from "sonner";

import { EntityFormModal } from "@/components/common/EntityFormModal";
import { useEntityForm } from "@/hooks/useEntityForm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type FormErrors = Partial<Record<"clientId" | "registration" | "brand" | "model", string>>;

type ApiError = {
  message?: string;
  response?: {
    data?: {
      message?: string;
    };
  };
};

export default function VehiclesListPage() {
  const router = useRouter();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  // 👉 Ajout des erreurs
  const [errors, setErrors] = useState<FormErrors>({});

  const {
    formData,
    setFormData,
    isEditing,
    isSubmitting,
    handleSubmit,
    openCreate,
    openEdit,
    resetForm,
  } = useEntityForm({
    service: vehicleService,
    initialData: {
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
    },
    onSuccess: async (result) => {
      await loadVehicles();
      setIsModalOpen(false);
      resetForm();

      if (!isEditing && result?.id) {
        router.push(`/vehicles/${result.id}`);
      } else {
        toast.success(isEditing ? 'Véhicule modifié avec succès' : 'Véhicule créé avec succès');
      }
    },
  });

  // 👉 Fonction de validation + soumission
 const handleFormSubmit = async () => {
  const newErrors: FormErrors = {};

  // === RÈGLE 1 : Client obligatoire ===
  if (!formData.clientId) {
    newErrors.clientId = "Le client est obligatoire";
  }

  if (!formData.registration?.trim()) {
    newErrors.registration =
      "L'immatriculation est obligatoire";
  }

  if (!formData.brand?.trim()) {
    newErrors.brand = "La marque est obligatoire";
  }
  if (!formData.model?.trim()) {
    newErrors.model = "Le modèle est obligatoire";
  }

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  setErrors({});
  await handleSubmit();
};

  // Chargement des véhicules
  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await vehicleService.getAll();
      setVehicles(data || []);
    } catch (err) {
      console.error("Erreur chargement véhicules", err);
      toast.error("Erreur lors du chargement des véhicules");
    } finally {
      setLoading(false);
    }
  };

  // Chargement des clients
  const loadClients = async () => {
    try {
      const workspaceId = localStorage.getItem("current_workspace_id");
      if (!workspaceId) return;

      const data = await clientService.getAll(workspaceId);
      setClientsList(data || []);
    } catch (err) {
      console.error("Erreur chargement clients", err);
    }
  };

  React.useEffect(() => {
    loadVehicles();
    loadClients();
  }, []);

  const columns: Column<Vehicle>[] = [
    {
      key: 'registration',
      header: 'Immatriculation',
    },
    {
      key: 'brand',
      header: 'Marque',
    },
    {
      key: 'model',
      header: 'Modèle',
    },
    {
      key: 'fleet_number',
      header: 'N° flotte',
      render: (vehicle) =>
        vehicle.fleet_number || '—',
    },
    {
      key: 'client',
      header: 'Client',
      render: (vehicle) =>
        vehicle.client?.company_name ||
        vehicle.client?.name ||
        '—',
    },
  ];

  const handleOpenCreate = () => {
    openCreate();
    setIsModalOpen(true);
  };

const handleOpenEdit = (vehicle: Vehicle) => {
  const normalizedVehicle = {
    id: vehicle.id,
    clientId:
      vehicle.client_id ||
      vehicle.clientId ||
      '',
    registration:
      vehicle.registration ||
      '',
    brand:
      vehicle.brand ||
      '',
    model: vehicle.model || '',
    status: vehicle.status || 'DISPONIBLE',
    fleet_number: vehicle.fleet_number || '',
    vin: vehicle.vin || '',
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
    usual_driver: vehicle.usual_driver || '',
    cost_center: vehicle.cost_center || '',
    service_name: vehicle.service_name || '',
  };

  openEdit(normalizedVehicle);
  setIsModalOpen(true);
};

  const handleDelete = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle);
    setConfirmOpen(true);
  };

  const confirmDeletion = async () => {
    if (!vehicleToDelete) return;

    try {
      await vehicleService.delete(vehicleToDelete.id);
      toast.success("Véhicule supprimé avec succès");
      loadVehicles();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const message =
        apiError.message ||
        apiError.response?.data?.message ||
        "Erreur lors de la suppression";
      toast.error(message, { duration: 6000 });
    }

    setConfirmOpen(false);
    setVehicleToDelete(null);
  };

  return (
    <div className="p-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gestion des véhicules</h1>
        <Button onClick={handleOpenCreate}>Nouveau véhicule</Button>
      </div>

      <DataTable
        data={vehicles}
        columns={columns}
        loading={loading}
        searchable={true}
        pageSize={15}
        onRowClick={(vehicle) => router.push(`/vehicles/${vehicle.id}`)}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
      />

      {/* Modale de création / édition */}
      <EntityFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
          setErrors({});
        }}
        title={isEditing ? "Modifier le véhicule" : "Nouveau véhicule"}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Client *
            </label>

            <select
              className={`w-full border rounded-2xl px-4 py-3 ${
                errors.clientId ? 'border-red-500' : ''
              }`}
              value={formData.clientId}
              onChange={(event) => {
                setFormData({
                  ...formData,
                  clientId: event.target.value,
                });

                if (errors.clientId) {
                  setErrors({
                    ...errors,
                    clientId: '',
                  });
                }
              }}
            >
              <option value="">
                -- Sélectionner un client --
              </option>

              {clientsList.map((client: Client) => (
                <option
                  key={client.id}
                  value={client.id}
                >
                  {client.company_name || client.name}
                </option>
              ))}
            </select>

            {errors.clientId && (
              <p className="text-red-500 text-sm mt-1">
                {errors.clientId}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Immatriculation *
            </label>

            <input
              className={`w-full border rounded-2xl px-4 py-3 ${
                errors.registration
                  ? 'border-red-500'
                  : ''
              }`}
              placeholder="Immatriculation"
              value={formData.registration}
              onChange={(event) => {
                setFormData({
                  ...formData,
                  registration: event.target.value,
                });

                if (errors.registration) {
                  setErrors({
                    ...errors,
                    registration: '',
                  });
                }
              }}
            />

            {errors.registration && (
              <p className="text-red-500 text-sm mt-1">
                {errors.registration}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Marque *
              </label>

              <input
                className={`w-full border rounded-2xl px-4 py-3 ${
                  errors.brand ? 'border-red-500' : ''
                }`}
                placeholder="Marque"
                value={formData.brand}
                onChange={(event) => {
                  setFormData({
                    ...formData,
                    brand: event.target.value,
                  });

                  if (errors.brand) {
                    setErrors({
                      ...errors,
                      brand: '',
                    });
                  }
                }}
              />

              {errors.brand && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.brand}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Modèle *
              </label>

              <input
                className={`w-full border rounded-2xl px-4 py-3 ${
                  errors.model ? 'border-red-500' : ''
                }`}
                placeholder="Modèle"
                value={formData.model}
                onChange={(event) => {
                  setFormData({
                    ...formData,
                    model: event.target.value,
                  });

                  if (errors.model) {
                    setErrors({
                      ...errors,
                      model: '',
                    });
                  }
                }}
              />

              {errors.model && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.model}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-slate-50 p-5 space-y-4">
            <h3 className="font-bold text-slate-900">
              Informations de flotte
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                className="w-full border rounded-2xl px-4 py-3 bg-white"
                placeholder="Numéro de flotte"
                value={formData.fleet_number}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    fleet_number: event.target.value,
                  })
                }
              />

              <input
                className="w-full border rounded-2xl px-4 py-3 bg-white"
                placeholder="Numéro VIN"
                value={formData.vin}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    vin: event.target.value,
                  })
                }
              />

              <input
                type="number"
                min="1900"
                max="2100"
                className="w-full border rounded-2xl px-4 py-3 bg-white"
                placeholder="Année"
                value={formData.year}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    year: event.target.value,
                  })
                }
              />

              <input
                type="number"
                min="0"
                className="w-full border rounded-2xl px-4 py-3 bg-white"
                placeholder="Kilométrage"
                value={formData.mileage}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    mileage: event.target.value,
                  })
                }
              />

              <input
                className="w-full border rounded-2xl px-4 py-3 bg-white"
                placeholder="Conducteur habituel"
                value={formData.usual_driver}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    usual_driver: event.target.value,
                  })
                }
              />

              <input
                className="w-full border rounded-2xl px-4 py-3 bg-white"
                placeholder="Centre de coût"
                value={formData.cost_center}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    cost_center: event.target.value,
                  })
                }
              />
            </div>

            <input
              className="w-full border rounded-2xl px-4 py-3 bg-white"
              placeholder="Service / département"
              value={formData.service_name}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  service_name: event.target.value,
                })
              }
            />
          </div>
        </div>
      </EntityFormModal>

      {/* Modale de confirmation */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Supprimer ce véhicule ?"
        description={
          vehicleToDelete
            ? `Êtes-vous sûr de vouloir supprimer le véhicule "${vehicleToDelete.registration}" ?`
            : ""
        }
        onConfirm={confirmDeletion}
      />
    </div>
  );
}

