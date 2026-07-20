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
      console.error("Erreur chargement vÃ©hicule", error);
      toast.error("Impossible de charger le vÃ©hicule");
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

    if (!confirm(`Supprimer le vÃ©hicule "${vehicle.plateNumber}" ?`)) return;

    try {
      await vehicleService.delete(vehicle.id);
      toast.success("VÃ©hicule supprimÃ© avec succÃ¨s");
      router.push("/vehicles");
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de la suppression");
    }
  };

  if (loading) {
    return <div className="p-10">Chargement du vÃ©hicule...</div>;
  }

  if (!vehicle) {
    return (
      <div className="p-10">
        <h1 className="text-2xl font-bold text-red-600">VÃ©hicule introuvable</h1>
        <Button className="mt-4" onClick={() => router.push("/vehicles")}>
          Retour Ã  la liste
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
          <h2 className="text-xl font-semibold mb-6">Informations du vÃ©hicule</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6">
            <div>
              <p className="text-sm text-gray-500">Immatriculation</p>
              <p className="text-lg font-medium">{vehicle.plateNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Marque / ModÃ¨le</p>
              <p className="text-lg font-medium">{vehicle.brand} {vehicle.model}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Client</p>
              <p 
                className="text-lg font-medium text-blue-600 cursor-pointer hover:underline"
                onClick={() => router.push(`/clients/${vehicle.clientId}`)}
              >
                {vehicle.client?.name || "â€”"}
              </p>
            </div>
          </div>
        </Card>

        {/* Actions rapides */}
        <Card className="p-8">
          <h2 className="text-xl font-semibold mb-6">Actions</h2>
          <div className="space-y-3">
            <Button className="w-full" onClick={() => router.push(`/appointments?vehicleId=${vehicle.id}`)}>
              Prendre rendez-vous
            </Button>
            <Button variant="outline" className="w-full">
              Ajouter une intervention
            </Button>
          </div>
        </Card>
      </div>

      {/* Section Photos (Ã  venir) */}
      <Card className="mt-6 p-8">
        <h2 className="text-xl font-semibold mb-4">Photos du vÃ©hicule</h2>
        <p className="text-gray-500">Aucune photo pour le moment.</p>
      </Card>
    </div>
  );
}