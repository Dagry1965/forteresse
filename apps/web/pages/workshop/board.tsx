'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { interventionService, Intervention } from '@/services/interventionService';
// ✅ Utilisation des constantes centralisées
import { CASE_STATUS } from '../../../../shared/constants/status.constants'; 
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import { Loader2, ArrowRight, User, Car, ClipboardList, LayoutList, RefreshCw } from 'lucide-react';

const COLUMNS = [
  { id: CASE_STATUS.RECEIVED, label: 'File d\'attente', color: 'border-t-slate-400', bg: 'bg-slate-50' },
  { id: CASE_STATUS.DIAGNOSIS, label: 'Diagnostic', color: 'border-t-blue-500', bg: 'bg-blue-50/30' },
  { id: CASE_STATUS.WAITING_PARTS, label: 'En attente de pièces', color: 'border-t-amber-500', bg: 'bg-amber-50/30' },
  { id: CASE_STATUS.IN_PROGRESS, label: 'En réparation', color: 'border-t-orange-500', bg: 'bg-orange-50/30' },
  { id: CASE_STATUS.COMPLETED, label: 'Terminé', color: 'border-t-green-500', bg: 'bg-green-50/30' },
];

export default function WorkshopBoardPage() {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchInterventions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await interventionService.getAll();
      setInterventions(data || []);
    } catch (e: unknown) {
      const status =
        e && typeof e === 'object' && 'status' in e
          ? (e as { status?: unknown }).status
          : undefined;

      if (status === 401) router.push('/login');
      toast.error("Erreur de chargement de l'atelier");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchInterventions();
  }, [fetchInterventions]);

  const moveCase = async (caseId: string, newStatus: string) => {
    try {
      await interventionService.updateCaseStatus(caseId, newStatus);
      toast.success('Statut du dossier mis ? jour');
      fetchInterventions();
    } catch (e) {
      toast.error('Erreur lors du d?placement');
    }
  };

  const getBoardStatus = (intervention: Intervention) =>
    intervention.case?.status || intervention.status;

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 h-[calc(100vh-80px)] flex flex-col bg-slate-50">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Tableau de Bord Atelier</h1>
          <p className="text-slate-500 font-medium">Gestion visuelle des dossiers en cours</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => router.push('/workshop')} variant="outline" className="flex gap-2 font-bold">
            <LayoutList size={16} /> Vue Liste
          </Button>
          <Button onClick={fetchInterventions} className="bg-blue-600 text-white hover:bg-blue-700 font-bold flex gap-2">
            <RefreshCw size={16} /> Actualiser
          </Button>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 flex-1 min-h-0 custom-scrollbar">
        {COLUMNS.map((col) => (
          <div key={col.id} className={`flex-shrink-0 w-80 flex flex-col rounded-xl border border-slate-200 shadow-sm ${col.bg}`}>
            <div className={`p-4 border-t-4 ${col.color} rounded-t-xl bg-white flex justify-between items-center`}>
              <h2 className="font-bold text-slate-700 uppercase text-xs tracking-widest">{col.label}</h2>
              <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-black">
                {interventions.filter(i => getBoardStatus(i) === col.id).length}
              </span>
            </div>

            <div className="p-3 space-y-4 overflow-y-auto flex-1">
              {interventions
                .filter((int) => getBoardStatus(int) === col.id)
                .map((int) => (
                  <Card 
                    key={int.id} 
                    className="p-4 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all border-none shadow-sm group bg-white"
                    // ✅ REDIRECTION CORRIGÉE VERS LE DOSSIER (CASE)
                    onClick={() => router.push(`/workshop/case/${int.case_id || int.case?.id}`)}
                  >
                    <div className="text-[10px] font-bold text-blue-500 mb-3 flex items-center gap-1">
                       <ClipboardList size={12} /> DOSSIER #{int.case?.id?.slice(-4).toUpperCase()}
                    </div>

                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                        <Car size={18} className="text-slate-600 group-hover:text-blue-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight text-sm uppercase">
                          {int.case?.vehicle?.brand} {int.case?.vehicle?.model}
                        </p>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5 font-bold">{int.case?.vehicle?.registration}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-md group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-100">
                      <User size={12} />
                      <span className="truncate font-medium">{int.case?.client?.name}</span>
                    </div>

                    {col.id !== CASE_STATUS.COMPLETED && (
                      <div className="flex justify-end mt-4 pt-3 border-t border-slate-50">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 text-blue-600 hover:bg-blue-50 hover:text-blue-700 text-[10px] font-black uppercase tracking-tighter"
                          onClick={(e) => {
                            e.stopPropagation();
                            const currentIndex = COLUMNS.findIndex(c => c.id === col.id);
                            if (currentIndex < COLUMNS.length - 1) {
                                const nextStatus = COLUMNS[currentIndex + 1].id;
                                const caseId = int.case_id || int.case?.id;
                                if (caseId) {
                                  moveCase(caseId, nextStatus);
                                }
                            }
                          }}
                        >
                          Suivant <ArrowRight size={14} className="ml-1" />
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              
              {interventions.filter(i => getBoardStatus(i) === col.id).length === 0 && (
                <div className="border-2 border-dashed border-slate-200 rounded-xl py-12 flex flex-col items-center justify-center text-slate-400 text-xs italic">
                  <p>Aucun véhicule</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
