'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { vehicleService } from "@/services/vehicleService";
import { clientService } from "@/services/clientService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function EditVehiclePage() {
  const router = useRouter();
  const vehicleId = router.query.id as string;

  const [formData, setFormData] = useState({
    plateNumber: '',
    make: '',
    model: '',
    clientId: '',
  });
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!vehicleId) return;

    try {
      setLoading(true);
      const [vehicle, clientsData] = await Promise.all([
        vehicleService.getOne(vehicleId),
        clientService.getAll(localStorage.getItem("current_workspace_id") || ""),
      ]);

      setFormData({
        plateNumber: vehicle.plateNumber || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        clientId: vehicle.clientId || '',
      });
      setClients(clientsData || []);
    } catch (error) {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [vehicleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await vehicleService.update(vehicleId, formData);
      toast.success("Véhicule mis à jour avec succès");
      router.push(`/vehicles/${vehicleId}`);
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de la mise à jour");
    }
  };

  if (loading) return <div className="p-10">Chargement...</div>;

  return (
    <div className="p-10 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Modifier le véhicule</h1>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Client</label>
            <select
              className="w-full border rounded-2xl px-4 py-3"
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              required
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Immatriculation</label>
            <input
              className="w-full border rounded-2xl px-4 py-3"
              value={formData.plateNumber}
              onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Marque</label>
            <input
              className="w-full border rounded-2xl px-4 py-3"
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Modèle</label>
            <input
              className="w-full border rounded-2xl px-4 py-3"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1">Enregistrer</Button>
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => router.push(`/vehicles/${vehicleId}`)}
            >
              Annuler
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}