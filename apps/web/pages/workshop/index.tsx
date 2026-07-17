'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { interventionService, Intervention } from '@/services/interventionService';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { LayoutGrid, RefreshCcw, History } from 'lucide-react'; // ← History ajouté

export default function WorkshopPage() {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const router = useRouter();

  const fetchInterventions = async () => {
    try {
      setLoading(true);
      const data = await interventionService.getAll();
      setInterventions(data || []);
    } catch (e: any) {
      console.error("Erreur Workshop:", e);
      if (e.status === 401) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        router.push('/login');
      } else {
        toast.error("Impossible de charger les interventions.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterventions();
  }, []);

  // ==================== FILTRAGE MIS À JOUR (Utilise .case) ====================
  const filteredInterventions = useMemo(() => {
    return interventions.filter((int) => {
      const matchStatus = !filterStatus || int.status === filterStatus;

      const s = searchTerm.toLowerCase().trim();
      const clientName = int.case?.client?.name?.toLowerCase() || '';
      const vehicleInfo = `${int.case?.vehicle?.brand || ''} ${int.case?.vehicle?.model || ''} ${int.case?.vehicle?.registration || ''}`.toLowerCase();
      
      const matchSearch = !s || clientName.includes(s) || vehicleInfo.includes(s);

      return matchStatus && matchSearch;
    });
  }, [interventions, filterStatus, searchTerm]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">🔧 Atelier</h1>
          <p className="text-sm text-slate-500 mt-1">Suivi des interventions par dossier</p>
        </div>
        
        {/* ================= ACTIONS HEADER ================= */}
        <div className="flex gap-3">
          {/* Nouveau bouton ajouté */}
          <Button 
            onClick={() => router.push('/billing')} 
            variant="ghost" 
            className="flex gap-2 text-slate-600 hover:text-slate-800"
          >
            <History size={16} />
            Historique Devis
          </Button>

          <Button 
            onClick={() => router.push('/workshop/board')} 
            variant="outline" 
            className="flex gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
          >
            <LayoutGrid size={16} />
            Vue Kanban
          </Button>
          
          <Button 
            onClick={fetchInterventions} 
            variant="outline" 
            size="sm" 
            disabled={loading} 
            className="flex gap-2"
          >
            <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
            {loading ? 'Chargement...' : 'Actualiser'}
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          className="border rounded-md px-3 py-2 text-sm bg-white min-w-[180px]"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="DIAGNOSIS">Diagnostic</option>
          <option value="IN_PROGRESS">En cours</option>
          <option value="COMPLETED">Terminé</option>
        </select>

        {/* Champ de recherche */}
        <div className="relative w-80">
          <input
            type="text"
            placeholder="Client, modèle ou plaque..."
            className="w-full border rounded-full px-10 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-4 top-2.5 text-gray-400 text-xs">🔍</span>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-4 top-2.5 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {(filterStatus || searchTerm) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterStatus('');
              setSearchTerm('');
            }}
          >
            Réinitialiser
          </Button>
        )}
      </div>

      <DataTable
        data={filteredInterventions}
        loading={loading}
        onRowClick={(row) => router.push(`/workshop/intervention/${row.id}`)}
        columns={[
          {
            key: 'date',
            header: 'Entrée',
            render: (r) =>
              new Date(r.created_at).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              }),
          },
          {
            key: 'case',
            header: 'Dossier',
            render: (r) => (
              <div className="flex flex-col">
                <span className="font-semibold text-blue-600">{r.case?.title || 'Sans titre'}</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">ID: {r.case?.id.slice(-6)}</span>
              </div>
            ),
          },
          {
            key: 'client',
            header: 'Client',
            render: (r) => r.case?.client?.name || '—',
          },
          {
            key: 'vehicle',
            header: 'Véhicule',
            render: (r) =>
              r.case?.vehicle
                ? `${r.case.vehicle.brand} ${r.case.vehicle.model} (${r.case.vehicle.registration})`
                : '—',
          },
          {
            key: 'status',
            header: 'Statut',
            render: (r) => {
              const colors: any = {
                PENDING: 'bg-gray-100 text-gray-600',
                DIAGNOSIS: 'bg-blue-100 text-blue-700',
                IN_PROGRESS: 'bg-orange-100 text-orange-700',
                COMPLETED: 'bg-green-100 text-green-700',
              };
              return (
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${colors[r.status] || 'bg-gray-100'}`}>
                  {r.status}
                </span>
              );
            },
          },
          {
            key: 'actions',
            header: 'Actions',
            render: (r) => (
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/workshop/intervention/${r.id}`);
                }}
              >
                Fiche Travaux
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}