'use client';

import React, { useState, useEffect } from 'react';
import { financeService } from '@/services/financeService';
import { clientService } from '@/services/clientService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { ChevronLeft, FileStack, Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FleetInvoicingPage() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Charger les clients entreprise
  useEffect(() => {
    const workspaceId =
      localStorage.getItem('current_workspace_id') || 'seed-workspace-1';

    clientService
      .getAll(workspaceId)
      .then((res) => {
        const list = res ?? [];
        setClients(
          list.filter(
            (c: any) => c.type === 'COMPANY' || c.type === 'entreprise'
          )
        );
      })
      .catch((err) => {
        console.error('Erreur chargement clients:', err);
        toast.error('Impossible de charger la liste des clients');
      });
  }, []);

  // 2. Charger les dossiers du client sÃ©lectionnÃ©
  useEffect(() => {
    if (!selectedClientId) {
      setPendingItems([]);
      return;
    }

    setLoading(true);

    financeService
      .getPendingFleetItems(selectedClientId)
      .then((res) => setPendingItems(res || []))
      .catch(() => toast.error('Erreur lors du chargement des dossiers'))
      .finally(() => setLoading(false));
  }, [selectedClientId]);

  const toggleItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleGenerateInvoice = async () => {
    if (selectedIds.length === 0)
      return toast.error('SÃ©lectionnez au moins un dossier');

    try {
      setLoading(true);

      await financeService.createGroupedInvoice({
        client_id: selectedClientId,
        appointment_ids: selectedIds,
      });

      toast.success('Facture groupÃ©e gÃ©nÃ©rÃ©e !');
     router.push('/dashboard'); 
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la gÃ©nÃ©ration de la facture flotte');
    } finally {
      setLoading(false);
    }
  };

  const totalSelected = pendingItems
    .filter((item) => selectedIds.includes(item.id))
    .reduce((sum, item) => {
      const amount = item.proformas?.[0]?.total || 0;
      return sum + Number(amount);
    }, 0);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ChevronLeft size={20} className="mr-2" /> Retour
        </Button>
        <h1 className="text-3xl font-black uppercase tracking-tighter">
          Facturation Flotte
        </h1>
      </div>

      {/* Ã‰tape 1 : Choix du client */}
      <Card className="p-6 border-blue-100 bg-blue-50/30 rounded-2xl">
        <label className="block text-xs font-black uppercase text-slate-500 mb-2">
          Choisir le client entreprise
        </label>

        <select
          className="w-full h-12 rounded-xl border-slate-200 px-4 font-bold bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          value={selectedClientId}
          onChange={(e) => {
            setSelectedClientId(e.target.value);
            setSelectedIds([]);
          }}
        >
          <option value="">-- SÃ©lectionner un compte flotte --</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Card>

      {/* Ã‰tape 2 : Liste des travaux */}
      {selectedClientId && (
        <div className="space-y-4">
          <h2 className="text-sm font-black uppercase text-slate-400">
            Travaux terminÃ©s en attente de facturation
          </h2>

          <div className="grid gap-3">
            {pendingItems.map((item) => (
              <Card
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`p-4 cursor-pointer transition-all border-2 rounded-xl ${
                  selectedIds.includes(item.id)
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl ${
                        selectedIds.includes(item.id)
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <Truck size={20} />
                    </div>

                    <div>
                      <p className="font-black text-slate-900">
                        {item.vehicle?.registration || 'Sans immat.'} -{' '}
                        {item.vehicle?.brand || 'VÃ©hicule inconnu'}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        RDV du{' '}
                        {new Date(item.date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-black text-lg text-slate-900">
                      {(
                        item.proformas?.[0]?.total ||
                        item.proformas?.total ||
                        item.total ||
                        0
                      ).toLocaleString()}{' '}
                      â‚¬
                    </p>
                    <p className="text-[10px] font-bold text-blue-600 uppercase">
                      TTC
                    </p>
                  </div>
                </div>
              </Card>
            ))}

            {pendingItems.length === 0 && !loading && (
              <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <FileStack
                  size={40}
                  className="mx-auto text-slate-300 mb-4"
                />
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">
                  Aucun dossier prÃªt pour la facturation.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ã‰tape 3 : Barre d'action flottante */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-0 right-0 flex justify-center px-4 z-50">
          <Card className="w-full max-w-2xl p-4 shadow-2xl border-blue-500 bg-white flex justify-between items-center rounded-2xl ring-4 ring-blue-500/10">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Total sÃ©lectionnÃ©
              </p>
              <p className="text-3xl font-black text-blue-600">
                {totalSelected.toLocaleString()} â‚¬
              </p>
            </div>

            <Button
              onClick={handleGenerateInvoice}
              className="bg-blue-600 hover:bg-blue-700 text-white h-14 px-8 font-black flex gap-3 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95"
              disabled={loading}
            >
              <FileStack size={20} />
              GÃ‰NÃ‰RER LA FACTURE ({selectedIds.length})
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}

