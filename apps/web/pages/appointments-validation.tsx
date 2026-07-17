'use client';

import React, { useEffect, useState } from 'react';
import { appointmentService } from "@/services/appointmentService";
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

export default function AppointmentsValidationPage() {
  const [pendingAppointments, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPending = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getPending();
      setPending(data || []);
    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleAction = async (id: string, action: 'confirm' | 'cancel') => {
    try {
      await appointmentService.validate(id, action);
      loadPending();
    } catch (error) {
      alert("Erreur lors de l'action");
    }
  };

  return (
    <div className="p-10 bg-[oklch(0.98_0_0)] min-h-screen">
      <header className="mb-10">
        <h1 className="text-4xl font-bold lowercase tracking-tight">Validation des rendez-vous</h1>
        <p className="text-[oklch(0.45_0_0)] italic">Réservations internet en attente de confirmation</p>
      </header>

      {loading ? (
        <div className="text-center py-20">Chargement...</div>
      ) : pendingAppointments.length === 0 ? (
        <Card className="p-20 text-center">Aucun rendez-vous à valider.</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pendingAppointments.map((appt) => (
            <Card key={appt.id} className="p-8 rounded-3xl flex flex-col gap-6">
              <div className="flex justify-between">
                <div>
                  <span className="text-xs uppercase text-[oklch(0.45_0_0)]">Client</span>
                  <div className="text-xl font-bold">{appt.vehicle?.client?.name}</div>
                </div>
                <Badge className="bg-yellow-100 text-yellow-700">Nouveau</Badge>
              </div>

              <div className="border-y py-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-[oklch(0.45_0_0)]">Véhicule</span>
                  <span className="font-medium">{appt.vehicle?.make} {appt.vehicle?.model}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[oklch(0.45_0_0)]">Date prévue</span>
                  <span>{new Date(appt.scheduled_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-[oklch(0.45_0_0)]">Motif</span>
                <p className="italic text-sm mt-1">"{appt.initial_description || 'Aucun motif précisé'}"</p>
              </div>

              <div className="flex gap-4 mt-auto">
                <Button onClick={() => handleAction(appt.id, 'confirm')} className="flex-1">
                  Accepter
                </Button>
                <Button variant="outline" onClick={() => handleAction(appt.id, 'cancel')} className="flex-1">
                  Refuser
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}