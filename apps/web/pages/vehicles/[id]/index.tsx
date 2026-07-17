'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { vehicleService } from "@/services/vehicleService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function VehicleDetailPage() {
  const router = useRouter();
  const vehicleId = router.query.id as string;

  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadVehicle = async () => {
    if (!vehicleId) return;

    try {
      setLoading(true);
      const data = await vehicleService.getOne(vehicleId);
      setVehicle(data);
    } catch (error) {
      console.error("Erreur chargement véhicule", error);
      toast.error("Impossible de charger le véhicule");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vehicleId) {
      loadVehicle();
    }
  }, [vehicleId]);

  const handleDelete = async () => {
    if (!vehicle) return;

    if (!confirm(`Supprimer le véhicule "${vehicle.plateNumber}" ?`)) return;

    try {
      await vehicleService.delete(vehicle.id);
      toast.success("Véhicule supprimé avec succès");
      router.push("/vehicles");
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de la suppression");
    }
  };

  if (loading) {
    return <div className="p-10">Chargement du véhicule...</div>;
  }

  if (!vehicle) {
    return (
      <div className="p-10">
        <h1 className="text-2xl font-bold text-red-600">Véhicule introuvable</h1>
        <Button className="mt-4" onClick={() => router.push("/vehicles")}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{vehicle.plateNumber}</h1>
          <p className="text-gray-500">{vehicle.brand} {vehicle.model}</p>
        </div>

        <div className="flex gap-3">
          <Button onClick={() => router.push(`/vehicles/${vehicle.id}/edit`)}>
            Modifier
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Supprimer
          </Button>
          <Button variant="outline" onClick={() => router.push("/vehicles")}>
            Retour
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <Card className="lg:col-span-2 p-8">
          <h2 className="text-xl font-semibold mb-6">Informations du véhicule</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6">
            <div>
              <p className="text-sm text-gray-500">Immatriculation</p>
              <p className="text-lg font-medium">{vehicle.plateNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Marque / Modèle</p>
              <p className="text-lg font-medium">{vehicle.brand} {vehicle.model}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Client</p>
              <p 
                className="text-lg font-medium text-blue-600 cursor-pointer hover:underline"
                onClick={() => router.push(`/clients/${vehicle.clientId}`)}
              >
                {vehicle.client?.name || "—"}
              </p>
            </div>
          </div>
        </Card>

        {/* Actions rapides */}
        <Card className="p-8">
          <h2 className="text-xl font-semibold mb-6">Actions</h2>
          <div className="space-y-3">
            <Button className="w-full" onClick={() => router.push(`/appointments/new?vehicleId=${vehicle.id}`)}>
              Prendre rendez-vous
            </Button>
            <Button variant="outline" className="w-full">
              Ajouter une intervention
            </Button>
          </div>
        </Card>
      </div>

      {/* Section Photos (à venir) */}
      <Card className="mt-6 p-8">
        <h2 className="text-xl font-semibold mb-4">Photos du véhicule</h2>
        <p className="text-gray-500">Aucune photo pour le moment.</p>
      </Card>
    </div>
  );
}