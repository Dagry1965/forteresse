'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { proformaService } from '@/services/proformaService';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card'; // 👈 L'IMPORT MANQUANT
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import { FileText, Printer, Search, Filter, Eye } from 'lucide-react';


export default function ProformasListPage() {
  const [proformas, setProformas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const fetchProformas = async () => {
    try {
      setLoading(true);
      const data = await proformaService.getAll();
      setProformas(data || []);
    } catch (e) {
      toast.error("Erreur lors du chargement des devis");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProformas();
  }, []);

  // Filtrage : Recherche par référence, nom client ou plaque
  const filteredData = useMemo(() => {
    return proformas.filter((p) => {
      const s = searchTerm.toLowerCase();
      return (
        p.reference.toLowerCase().includes(s) ||
        p.case?.client?.name?.toLowerCase().includes(s) ||
        p.case?.vehicle?.registration?.toLowerCase().includes(s)
      );
    });
  }, [proformas, searchTerm]);

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">📜 DEVIS & PROFORMAS</h1>
          <p className="text-sm text-slate-500 mt-1">Historique des documents commerciaux générés</p>
        </div>
        <Button onClick={fetchProformas} variant="outline" size="sm">
          Actualiser la liste
        </Button>
      </div>

      {/* BARRE DE RECHERCHE */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher par référence, client ou immatriculation..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="ghost" className="text-slate-500 flex gap-2">
          <Filter size={16} /> Filtres avancés
        </Button>
      </div>

      {/* TABLEAU DES DONNÉES */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <DataTable
          data={filteredData}
          loading={loading}
          onRowClick={(row) => router.push(`/billing/proforma/${row.id}`)}
          columns={[
            {
              key: 'reference',
              header: 'Référence',
              render: (r) => (
                <span className="font-mono font-bold text-blue-600">{r.reference}</span>
              ),
            },
            {
              key: 'date',
              header: 'Date',
              render: (r) => new Date(r.created_at).toLocaleDateString('fr-FR'),
            },
            {
              key: 'client',
              header: 'Client',
              render: (r) => (
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900">{r.case?.client?.name || '—'}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-tighter">
                    {r.case?.vehicle?.brand} {r.case?.vehicle?.model}
                  </span>
                </div>
              ),
            },
            {
              key: 'total',
              header: 'Montant TTC',
              render: (r) => (
                <span className="font-black text-slate-900">
                  {r.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'État',
              render: (r) => (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md text-[10px] font-bold uppercase">
                  {r.status}
                </span>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (r) => (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="h-8 flex gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/billing/proforma/${r.id}`);
                    }}
                  >
                    <Eye size={14} /> Voir
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 p-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`/billing/proforma/${r.id}`, '_blank');
                    }}
                  >
                    <Printer size={14} />
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* RÉSUMÉ RAPIDE */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-4 bg-blue-600 text-white">
            <p className="text-xs font-bold uppercase opacity-80">Total Devis En cours</p>
            <p className="text-2xl font-black">
              {filteredData.reduce((acc, p) => acc + p.total, 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </p>
          </Card>
          <Card className="p-4 bg-white border-slate-100">
            <p className="text-xs font-bold uppercase text-slate-400">Nombre de documents</p>
            <p className="text-2xl font-black text-slate-800">{filteredData.length}</p>
          </Card>
        </div>
      )}
    </div>
  );
}
