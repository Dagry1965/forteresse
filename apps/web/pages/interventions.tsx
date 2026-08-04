'use client';

import React, { useEffect, useState } from 'react';
import { workshopService, type WorkshopIntervention } from '@/services/workshopService';
import { Button } from '../components/ui/button';
import Section from '../components/section';
import { Card } from '../components/ui/card';
import { INTERVENTION_STATUS } from '../../../shared/constants/status.constants';

type InterventionListItem = WorkshopIntervention & {
  createdAt?: string;
  created_at?: string;
  appointment?: {
    initial_description?: string;
    vehicle?: {
      plateNumber?: string;
      client?: {
        name?: string;
      };
    };
  };
};

export default function InterventionsPage() {
  const [interventions, setInterventions] = useState<InterventionListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInterventions = async () => {
    try {
      setLoading(true);
      const data = await workshopService.getAll();
      setInterventions((data || []) as InterventionListItem[]);
    } catch (error) {
      console.error("Erreur lors du chargement des interventions", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterventions();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await workshopService.updateStatus(id, newStatus);
      loadInterventions();
    } catch (error) {
      alert("Erreur lors du changement de statut");
    }
  };

  if (loading) {
    return <div className="p-10">Chargement des interventions...</div>;
  }

  return (
    <div className="p-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight lowercase">Interventions</h1>
          <p className="text-[oklch(0.45_0_0)]">Suivi des travaux en atelier</p>
        </div>
      </div>

      {interventions.length === 0 ? (
        <Card className="p-20 text-center">
          <p className="text-[oklch(0.45_0_0)]">Aucune intervention en cours.</p>
        </Card>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-[oklch(0.98_0_0)]">
                <th className="px-6 py-4 text-left font-bold text-[oklch(0.45_0_0)]">Véhicule / Client</th>
                <th className="px-6 py-4 text-left font-bold text-[oklch(0.45_0_0)]">Motif</th>
                <th className="px-6 py-4 text-center font-bold text-[oklch(0.45_0_0)]">Statut</th>
                <th className="px-6 py-4 text-center font-bold text-[oklch(0.45_0_0)]">Date</th>
                <th className="px-6 py-4 text-center font-bold text-[oklch(0.45_0_0)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {interventions.map((intervention) => (
                <tr key={intervention.id} className="border-b hover:bg-[oklch(0.99_0_0)]">
                  <td className="px-6 py-5">
                    <div className="font-bold">
                      {intervention.appointment?.vehicle?.plateNumber}
                    </div>
                    <div className="text-xs text-[oklch(0.45_0_0)]">
                      {intervention.appointment?.vehicle?.client?.name}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-[oklch(0.35_0_0)]">
                    {intervention.appointment?.initial_description || "—"}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-4 py-1 rounded-full text-xs font-bold ${
                      intervention.status === INTERVENTION_STATUS.COMPLETED
                        ? 'bg-emerald-100 text-emerald-700'
                        : intervention.status === INTERVENTION_STATUS.IN_PROGRESS
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {intervention.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center text-[oklch(0.45_0_0)]">
                    {intervention.createdAt || intervention.created_at
                      ? new Date(
                          intervention.createdAt || intervention.created_at || '',
                        ).toLocaleDateString('fr-FR')
                      : '\u2014'}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex justify-center gap-2">
                      {intervention.status !== INTERVENTION_STATUS.COMPLETED && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(intervention.id, INTERVENTION_STATUS.IN_PROGRESS)}
                          >
                            En cours
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateStatus(intervention.id, INTERVENTION_STATUS.COMPLETED)}
                          >
                            Terminer
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
