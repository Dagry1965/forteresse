'use client';

import React, { useState } from "react";
import { clientService } from "@/services/clientService";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { DataTable, Column } from "@/components/ui/data-table";
import { toast } from "sonner";

import { EntityFormModal } from "@/components/common/EntityFormModal";
import { useEntityForm } from "@/hooks/useEntityForm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function ClientsListPage() {
  const router = useRouter();

  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<any | null>(null);

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
    service: clientService,
    initialData: {
      type: 'INDIVIDUAL' as 'INDIVIDUAL' | 'COMPANY',
      name: '',
      email: '',
      phone: '',
      company_name: '',
      trade_name: '',
      registration_number: '',
      vat_number: '',
      address: '',
      billing_address: '',
      payment_terms_days: 0,
      credit_limit: '',
    },
    onSuccess: async (result) => {
      await loadClients();
      setIsModalOpen(false);
      resetForm();

      if (!isEditing && result?.id) {
        router.push(`/clients/${result.id}`);
      } else {
        toast.success(isEditing ? 'Client modifié avec succès' : 'Client créé avec succès');
      }
    },
  });

  const loadClients = async () => {
    try {
      setLoading(true);
      const workspaceId = localStorage.getItem("current_workspace_id");

      if (!workspaceId) {
        toast.error("Aucun workspace sélectionné");
        setClients([]);
        return;
      }

      const data = await clientService.getAll(workspaceId);
      setClients(data || []);
    } catch (err) {
      console.error("Erreur chargement clients", err);
      toast.error("Erreur lors du chargement des clients");
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadClients();
  }, []);

  const columns: Column<any>[] = [
    { key: 'name', header: 'Nom / Raison sociale' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Téléphone' },
    {
      key: 'type',
      header: 'Type',
      render: (client) => (
        <span className={`px-3 py-1 text-xs rounded-full font-medium ${
          client.type === 'COMPANY' 
            ? 'bg-blue-100 text-blue-700' 
            : 'bg-emerald-100 text-emerald-700'
        }`}>
          {client.type === 'COMPANY' ? 'Entreprise' : 'Particulier'}
        </span>
      ),
    },
  ];

  const handleOpenCreate = () => {
    openCreate();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: any) => {
    openEdit(client);
    setIsModalOpen(true);
  };

  const handleDelete = (client: any) => {
    setClientToDelete(client);
    setConfirmOpen(true);
  };

  const confirmDeletion = async () => {
    if (!clientToDelete) return;

    try {
      await clientService.delete(clientToDelete.id);
      toast.success("Client supprimé avec succès");
      loadClients();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Erreur lors de la suppression";
      toast.error(message, { duration: 6000 });
    }

    setConfirmOpen(false);
    setClientToDelete(null);
  };

  return (
    <div className="p-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gestion des clients</h1>
        <Button onClick={handleOpenCreate}>Nouveau client</Button>
      </div>

      <DataTable
        data={clients}
        columns={columns}
        loading={loading}
        searchable={true}
        pageSize={15}
        onRowClick={(client) => router.push(`/clients/${client.id}`)}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
      />

      {/* Modale création / édition */}
      <EntityFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={isEditing ? "Modifier le client" : "Nouveau client"}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      >
        <div className="space-y-4">
          <select
            className="w-full border rounded-2xl px-4 py-3"
            value={formData.type}
            onChange={(e) => setFormData({
              ...formData,
              type: e.target.value as 'INDIVIDUAL' | 'COMPANY',
            })}
          >
            <option value="INDIVIDUAL">Particulier</option>
            <option value="COMPANY">Entreprise</option>
          </select>

          <input
            className="w-full border rounded-2xl px-4 py-3"
            placeholder="Nom / Raison sociale *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <input
            className="w-full border rounded-2xl px-4 py-3"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <input
            className="w-full border rounded-2xl px-4 py-3"
            placeholder="Téléphone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          {formData.type === "COMPANY" && (
            <>
              <input
                className="w-full border rounded-2xl px-4 py-3"
                placeholder="Raison sociale"
                value={formData.company_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    company_name: e.target.value,
                    name: e.target.value || formData.name,
                  })
                }
              />

              <input
                className="w-full border rounded-2xl px-4 py-3"
                placeholder="Nom commercial"
                value={formData.trade_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    trade_name: e.target.value,
                  })
                }
              />

              <input
                className="w-full border rounded-2xl px-4 py-3"
                placeholder="Num?ro d'entreprise / SIRET / BCE / RCCM"
                value={formData.registration_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    registration_number: e.target.value,
                  })
                }
              />

              <input
                className="w-full border rounded-2xl px-4 py-3"
                placeholder="Num?ro de TVA"
                value={formData.vat_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    vat_number: e.target.value,
                  })
                }
              />

              <textarea
                className="w-full border rounded-2xl px-4 py-3 min-h-[90px]"
                placeholder="Adresse principale"
                value={formData.address}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: e.target.value,
                  })
                }
              />

              <textarea
                className="w-full border rounded-2xl px-4 py-3 min-h-[90px]"
                placeholder="Adresse de facturation"
                value={formData.billing_address}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    billing_address: e.target.value,
                  })
                }
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="w-full border rounded-2xl px-4 py-3"
                  placeholder="D?lai de paiement en jours"
                  value={formData.payment_terms_days}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment_terms_days: Number(e.target.value || 0),
                    })
                  }
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full border rounded-2xl px-4 py-3"
                  placeholder="Plafond de cr?dit"
                  value={formData.credit_limit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      credit_limit: e.target.value,
                    })
                  }
                />
              </div>
            </>
          )}
        </div>
      </EntityFormModal>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Supprimer ce client ?"
        description={
          clientToDelete
            ? `Êtes-vous sûr de vouloir supprimer "${clientToDelete.name}" ?`
            : ""
        }
        onConfirm={confirmDeletion}
      />
    </div>
  );
}