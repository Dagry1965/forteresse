'use client';

import React, { useEffect, useState } from 'react';
import { workshopService } from '@/services/workshopService';
import { appointmentService } from '@/services/appointmentService';
import { Button } from '../../components/ui/button';
import Section from '../../components/section';
import { normalizeList } from '@/utils/normalize';
import { INTERVENTION_STATUS } from '../../../../shared/constants/status.constants';

export default function WorkshopPage() {
  const [interventions, setInterventions] = useState<any[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const intervsRaw = await workshopService.getAll();
      const pendingRaw = await appointmentService.getPending();

      // 🔥 Normalisation backend
      const intervs = normalizeList(intervsRaw);
      const pending = normalizeList(pendingRaw);

      setInterventions(intervs);
      setPendingAppointments(pending);
    } catch (err) {
      console.error("Erreur chargement atelier", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const startFromAppointment = async (appointmentId: string) => {
    try {
      await appointmentService.startIntervention(appointmentId);
      alert("Intervention démarrée !");
      loadData();
    } catch (err) {
      alert("Erreur lors du démarrage de l'intervention");
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await workshopService.updateStatus(id, newStatus);
      loadData();
    } catch (err) {
      alert("Erreur lors du changement de statut");
    }
  };

  if (loading) return <div className="p-10">Chargement de l'atelier...</div>;

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold tracking-tight lowercase mb-8">Atelier</h1>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Interventions en cours */}
        <Section title="Interventions en cours">
          {interventions.length === 0 ? (
            <p className="text-[oklch(0.45_0_0)]">Aucune intervention en cours.</p>
          ) : (
            <div className="space-y-4">
              {interventions.map((inter) => (
                <div key={inter.id} className="border rounded-2xl p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold">
                        {inter.appointment?.vehicle?.plateNumber} — {inter.appointment?.vehicle?.client?.name}
                      </div>
                      <div className="text-sm text-[oklch(0.45_0_0)]">
                        {inter.appointment?.initial_description}
                      </div>
                    </div>
                    <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                      {inter.status}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button size="sm" onClick={() => updateStatus(inter.id, INTERVENTION_STATUS.DIAGNOSIS)}>
                      Diagnostic
                    </Button>
                    <Button size="sm" onClick={() => updateStatus(inter.id, INTERVENTION_STATUS.IN_PROGRESS)}>
                      En cours
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(inter.id, INTERVENTION_STATUS.COMPLETED)}>
                      Terminer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Rendez-vous en attente */}
        <Section title="Rendez-vous à démarrer">
          {pendingAppointments.length === 0 ? (
            <p className="text-[oklch(0.45_0_0)]">Aucun rendez-vous en attente.</p>
          ) : (
            <div className="space-y-4">
              {pendingAppointments.map((appt) => (
                <div key={appt.id} className="border rounded-2xl p-5 flex justify-between items-center">
                  <div>
                    <div className="font-bold">{appt.vehicle?.client?.name}</div>
                    <div className="text-sm text-[oklch(0.45_0_0)]">
                      {appt.vehicle?.make} {appt.vehicle?.model} — {appt.vehicle?.plateNumber}
                    </div>
                  </div>
                  <Button onClick={() => startFromAppointment(appt.id)}>
                    Démarrer intervention
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}


