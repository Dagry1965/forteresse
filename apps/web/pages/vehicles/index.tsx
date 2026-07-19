'use client';

import React, { useState } from "react";
import { vehicleService } from "@/services/vehicleService";
import { clientService } from "@/services/clientService";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { DataTable, Column } from "@/components/ui/data-table";
import { toast } from "sonner";

import { EntityFormModal } from "@/components/common/EntityFormModal";
import { useEntityForm } from "@/hooks/useEntityForm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function VehiclesListPage() {
  const router = useRouter();

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<any | null>(null);

  // 👉 Ajout des erreurs
  const [errors, setErrors] = useState<any>({});

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
      make: '',
      model: '',
      plateNumber: '',
      clientId: '',
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
  const newErrors: any = {};

  // === RÈGLE 1 : Client obligatoire ===
  if (!formData.clientId) {
    newErrors.clientId = "Le client est obligatoire";
  }

  if (!formData.plateNumber?.trim()) {
    newErrors.plateNumber = "L'immatriculation est obligatoire";
  }
  if (!formData.make?.trim()) {
    newErrors.make = "La marque est obligatoire";
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

  const columns: Column<any>[] = [
    { key: 'plateNumber', header: 'Immatriculation' },
    { key: 'make', header: 'Marque' },
    { key: 'model', header: 'Modèle' },
    {
      key: 'client',
      header: 'Client',
      render: (v) => v.client?.name || '—',
    },
  ];

  const handleOpenCreate = () => {
    openCreate();
    setIsModalOpen(true);
  };

const handleOpenEdit = (vehicle: any) => {
  const normalizedVehicle = {
    id: vehicle.id || vehicle._id,
    make: vehicle.make || '',
    model: vehicle.model || '',
    plateNumber: vehicle.plateNumber || vehicle.registration || '',
    clientId: vehicle.client_id || vehicle.clientId || '',
  };

  openEdit(normalizedVehicle);
  setIsModalOpen(true);
};

  const handleDelete = (vehicle: any) => {
    setVehicleToDelete(vehicle);
    setConfirmOpen(true);
  };

  const confirmDeletion = async () => {
    if (!vehicleToDelete) return;

    try {
      await vehicleService.delete(vehicleToDelete.id);
      toast.success("Véhicule supprimé avec succès");
      loadVehicles();
    } catch (error: any) {
      const message =
        error?.message ||
        error?.response?.data?.message ||
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

          {/* Client */}
          <div>
            <label className="block text-sm font-medium mb-1">Client *</label>
            <select
              className={`w-full border rounded-2xl px-4 py-3 ${errors.clientId ? 'border-red-500' : ''}`}
              value={formData.clientId}
              onChange={(e) => {
                setFormData({ ...formData, clientId: e.target.value });
                if (errors.clientId) setErrors({ ...errors, clientId: '' });
              }}
            >
              <option value="">-- Sélectionner un client --</option>
              {clientsList.map((client: any) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {errors.clientId && (
              <p className="text-red-500 text-sm mt-1">{errors.clientId}</p>
            )}
          </div>

          {/* Immatriculation */}
          <div>
            <label className="block text-sm font-medium mb-1">Immatriculation *</label>
            <input
              className={`w-full border rounded-2xl px-4 py-3 ${errors.plateNumber ? 'border-red-500' : ''}`}
              placeholder="Immatriculation"
              value={formData.plateNumber}
              onChange={(e) => {
                setFormData({ ...formData, plateNumber: e.target.value });
                if (errors.plateNumber) setErrors({ ...errors, plateNumber: '' });
              }}
            />
            {errors.plateNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.plateNumber}</p>
            )}
          </div>

          {/* Marque */}
          <div>
            <label className="block text-sm font-medium mb-1">Marque *</label>
            <input
              className={`w-full border rounded-2xl px-4 py-3 ${errors.make ? 'border-red-500' : ''}`}
              placeholder="Marque"
              value={formData.make}
              onChange={(e) => {
                setFormData({ ...formData, make: e.target.value });
                if (errors.make) setErrors({ ...errors, make: '' });
              }}
            />
            {errors.make && (
              <p className="text-red-500 text-sm mt-1">{errors.make}</p>
            )}
          </div>

          {/* Modèle */}
          <div>
            <label className="block text-sm font-medium mb-1">Modèle *</label>
            <input
              className={`w-full border rounded-2xl px-4 py-3 ${errors.model ? 'border-red-500' : ''}`}
              placeholder="Modèle"
              value={formData.model}
              onChange={(e) => {
                setFormData({ ...formData, model: e.target.value });
                if (errors.model) setErrors({ ...errors, model: '' });
              }}
            />
            {errors.model && (
              <p className="text-red-500 text-sm mt-1">{errors.model}</p>
            )}
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
            ? `Êtes-vous sûr de vouloir supprimer le véhicule "${vehicleToDelete.plateNumber}" ?`
            : ""
        }
        onConfirm={confirmDeletion}
      />
    </div>
  );
}

