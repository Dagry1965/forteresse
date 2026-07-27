'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { interventionService, Intervention } from '@/services/interventionService';
import { stockService } from '@/services/stockService';
// ✅ AJOUT DE L'IMPORT DES CONSTANTES
import {
  CASE_STATUS,
  INTERVENTION_STATUS,
  PROFORMA_STATUS,
} from '../../../../../../shared/constants/status.constants';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Trash2,
  PlusCircle,
  Search,
  Package,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Save,
  Undo2,
  FileText,
  Play // ✅ Ajouté pour l'état en cours
} from 'lucide-react';

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  /* ================= ÉTATS DU DOSSIER ================= */
  const [dossier, setDossier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false); // ✅ État pour sécuriser les clics
  const [stockItems, setStockItems] = useState<any[]>([]);

  // États pour la recherche de pièces
  const [searchPart, setSearchTermPart] = useState('');
  const [activeSearchPhase, setActiveSearchPhase] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  /* ================= CHARGEMENT DES DONNÉES ================= */

  const fetchFullDossier = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);

      // 1. On récupère l'intervention pour avoir le case_id
      const currentInt = await interventionService.getOne(id);

      // 2. On récupère le dossier complet
      if (!currentInt.case_id) {
        throw new Error("Cette intervention n'est associ�e � aucun dossier.");
      }

      const data = await interventionService.getCaseDetails(currentInt.case_id);
      setDossier(data);
    } catch (e: any) {
      toast.error("Erreur lors du chargement du dossier");
      router.push('/workshop');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  const fetchStock = async () => {
    try {
      const workspaceId = localStorage.getItem('current_workspace_id') || undefined;
      const data = await stockService.getAll(workspaceId);
      setStockItems(data || []);
    } catch (e) {
      console.error("Erreur chargement stock", e);
    }
  };

  useEffect(() => {
    fetchFullDossier();
    fetchStock();
  }, [fetchFullDossier]);

  /* ================= ACTIONS SUR LES PHASES ================= */

  const handleAddNewPhase = async () => {
    try {
      await interventionService.createNewPhase(
        dossier.id,
        "Nouveau problème détecté (ex: fuite, pièce usée au démontage...)"
      );

      toast.success("Nouvelle phase de travail ajoutée");
      fetchFullDossier();
    } catch (e) {
      toast.error("Erreur lors de la création");
    }
  };

  const handleSavePhase = async (
    phaseId: string,
    description: string,
    status: string
  ) => {
    try {
      await interventionService.update(phaseId, {
        description,
        status: status as any,
      });

      toast.success("Mise à jour enregistrée");
      fetchFullDossier();
    } catch (e) {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleAddPartToPhase = async (phaseId: string, itemId: string) => {
    try {
      await interventionService.addPart(phaseId, {
        item_id: itemId,
        quantity: 1,
      });

      toast.success("Pièce ajoutée à la phase");
      setSearchTermPart('');
      setActiveSearchPhase(null);
      fetchFullDossier();
    } catch (e) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleRemovePart = async (partId: string) => {
    try {
      await interventionService.removePart(partId);
      toast.success("Pièce retirée");
      fetchFullDossier();
    } catch (e) {
      toast.error("Erreur de suppression");
    }
  };

  /* ================= GÉNÉRATION PROFORMA ================= */

  const handleGenerateProforma = async () => {
    try {
      setActionLoading(true);
      const proforma = await interventionService.generateProforma(dossier.id);
      toast.success(`Proforma ${proforma.reference} générée !`);
      router.push(`/billing/proforma/${proforma.id}`);
    } catch (e) {
      toast.error("Erreur lors de la génération du devis global");
    } finally {
      setActionLoading(false);
    }
  };

  /* ================= VALIDATION ACCORD CLIENT (CORRIGÉ) ================= */

  const handleApproveCase = async () => {
    try {
      setActionLoading(true);
      // ✅ Appel conforme à votre architecture /case/:id/status
      await interventionService.updateCaseStatus(dossier.id, CASE_STATUS.IN_PROGRESS);

      toast.success("Accord client enregistré ! Travaux lancés.");
      await fetchFullDossier();
    } catch (e) {
      toast.error("Erreur lors de la validation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartRepair = async () => {
    try {
      setActionLoading(true);

      await interventionService.updateCaseStatus(
        dossier.id,
        CASE_STATUS.IN_PROGRESS
      );

      toast.success("Le dossier est passé en réparation.");
      await fetchFullDossier();
    } catch (e) {
      toast.error("Erreur lors du passage en réparation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteCase = async () => {
    try {
      setActionLoading(true);

      await interventionService.updateCaseStatus(
        dossier.id,
        CASE_STATUS.COMPLETED
      );

      toast.success(
        "Toutes les interventions sont termin?es. Dossier pr?t pour la comptabilit?."
      );

      await fetchFullDossier();
    } catch (e) {
      toast.error("Erreur lors de la cl?ture des travaux");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !dossier) {
    return (
      <div className="p-10 text-center text-slate-500 font-medium">
        Analyse du dossier en cours...
      </div>
    );
  }

  /* ================= CALCULS FINANCIERS ================= */

  const totalHT = dossier.interventions?.reduce((acc: number, phase: any) => {
    const phaseSum =
      phase.InterventionPart?.reduce(
        (s: number, p: any) => s + p.price_snapshot * p.quantity,
        0
      ) || 0;

    return acc + phaseSum;
  }, 0) || 0;

  const tva = totalHT * 0.20;
  const totalTTC = totalHT + tva;
  const currentProforma = dossier.proformas?.[0];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 pb-20">

      {/* HEADER DU DOSSIER */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="bg-blue-600 p-4 rounded-xl text-white">
            <Package size={32} />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black px-2 py-0.5 bg-slate-900 text-white rounded uppercase tracking-tighter">
                DOSSIER #{dossier.id.slice(-6).toUpperCase()}
              </span>

              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                  dossier.status === 'INVOICED'
                    ? 'bg-green-100 text-green-700'
                    : dossier.status === CASE_STATUS.IN_PROGRESS
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-orange-100 text-orange-700'
                }`}
              >
                {dossier.status}
              </span>
            </div>

            <h1 className="text-2xl font-black text-slate-900 uppercase">
              {dossier.vehicle?.brand} {dossier.vehicle?.model}
            </h1>

            <p className="text-sm text-slate-500 font-medium italic">
              Propriétaire : {dossier.client?.name} — Immatriculation :{' '}
              {dossier.vehicle?.registration}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/workshop')}
            className="flex gap-2"
          >
            <Undo2 size={16} /> Retour Liste
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push('/workshop/board')}
            className="flex gap-2"
          >
            <LayoutList size={16} /> Voir Board
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* COLONNE GAUCHE : TIMELINE DES TRAVAUX */}
        <div className="lg:col-span-3 space-y-12">

          {dossier.interventions.map((phase: any, index: number) => (
            <div key={phase.id} className="relative">
              {/* Ligne de timeline verticale */}
              {index < dossier.interventions.length - 1 && (
                <div className="absolute left-6 top-14 bottom-[-48px] w-1 bg-slate-100 -z-10" />
              )}

              <div className="flex gap-6">
                {/* Pastille Numéro */}
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-black text-white shadow-lg z-10 ${
                    phase.status === INTERVENTION_STATUS.COMPLETED
                      ? 'bg-green-500'
                      : 'bg-blue-600'
                  }`}
                >
                  {index + 1}
                </div>

                <div className="flex-1">
                  <Card
                    className={`overflow-hidden border-2 transition-all ${
                      phase.status === INTERVENTION_STATUS.COMPLETED
                        ? 'border-green-100 shadow-none'
                        : 'border-white shadow-md'
                    }`}
                  >

                    {/* Header de la Phase */}
                    <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-slate-400" />

                        <h3 className="font-black text-xs uppercase text-slate-700 tracking-widest">
                          {index === 0
                            ? "Diagnostic de départ"
                            : "Travaux Supplémentaires"}
                        </h3>
                      </div>

                      <span className="text-[11px] font-black border-2 border-slate-200 rounded-lg px-3 py-1 bg-white text-slate-700">
                        {phase.status === INTERVENTION_STATUS.PENDING
                          ? 'EN ATTENTE'
                          : phase.status === INTERVENTION_STATUS.DIAGNOSIS
                            ? 'DIAGNOSTIC'
                            : phase.status === INTERVENTION_STATUS.IN_PROGRESS
                              ? 'EN COURS'
                              : phase.status === INTERVENTION_STATUS.COMPLETED
                                ? 'TERMIN?'
                                : phase.status}
                      </span>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Description technique */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">
                          Notes du mécanicien
                        </label>

                        <textarea
                          className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                          defaultValue={phase.description}
                          onBlur={(e) =>
                            handleSavePhase(
                              phase.id,
                              e.target.value,
                              phase.status
                            )
                          }
                          placeholder="Décrivez les pannes ou les travaux effectués..."
                        />
                      </div>

                      {/* Section Pièces de cette phase */}
                      <div className="pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                            Pièces & Fournitures Phase {index + 1}
                          </h4>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 font-bold text-xs"
                            onClick={() => {
                              setActiveSearchPhase(
                                activeSearchPhase === phase.id ? null : phase.id
                              );
                              setSearchTermPart('');
                            }}
                          >
                            <PlusCircle size={14} className="mr-1" /> Ajouter un article
                          </Button>
                        </div>

                        {/* Moteur de recherche local à la phase */}
                        {activeSearchPhase === phase.id && (
                          <div className="relative mb-6 animate-in fade-in slide-in-from-top-2">
                            <Search
                              className="absolute left-3 top-3 text-slate-400"
                              size={18}
                            />

                            <input
                              autoFocus
                              className="w-full pl-10 pr-4 py-3 bg-blue-50/50 border-2 border-blue-200 rounded-xl text-sm outline-none"
                              placeholder="Taper le nom d'une pièce..."
                              value={searchPart}
                              onChange={(e) => setSearchTermPart(e.target.value)}
                            />

                            {searchPart.length > 1 && (
                              <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 shadow-2xl rounded-xl max-h-48 overflow-y-auto">
                                {stockItems
                                  .filter((i) =>
                                    i.name
                                      .toLowerCase()
                                      .includes(searchPart.toLowerCase())
                                  )
                                  .map((item) => (
                                    <div
                                      key={item.id}
                                      className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b last:border-0"
                                      onClick={() =>
                                        handleAddPartToPhase(phase.id, item.id)
                                      }
                                    >
                                      <span className="font-bold text-sm">
                                        {item.name}
                                      </span>

                                      <span className="text-blue-600 font-black text-sm">
                                        {item.price_sell} €
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Liste des pièces de la phase */}
                        {phase.InterventionPart && phase.InterventionPart.length > 0 ? (
                          <div className="space-y-2">
                            {phase.InterventionPart.map((p: any) => (
                              <div
                                key={p.id}
                                className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-50 group hover:border-slate-200 transition-all"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-500">
                                    <Package size={14} />
                                  </div>

                                  <span className="text-sm font-semibold text-slate-700">
                                    {p.item?.name}
                                  </span>

                                  <span className="text-xs text-slate-400">
                                    x{p.quantity}
                                  </span>
                                </div>

                                <div className="flex items-center gap-4">
                                  <span className="font-mono font-bold text-slate-900">
                                    {p.price_snapshot} €
                                  </span>

                                  <button
                                    onClick={() => handleRemovePart(p.id)}
                                    className="text-slate-200 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center py-6 text-slate-400 text-xs italic bg-slate-50/50 rounded-xl border border-dashed">
                            Aucune pièce ajoutée pour le moment
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          ))}

          {/* BOUTON D'AJOUT DE PHASE */}
          <button
            onClick={handleAddNewPhase}
            className="w-full ml-16 max-w-[calc(100%-64px)] py-10 border-4 border-dashed border-slate-200 rounded-3xl text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex flex-col items-center gap-3 group"
          >
            <div className="bg-slate-100 p-3 rounded-full group-hover:bg-blue-100 transition-colors">
              <AlertCircle size={32} />
            </div>

            <div className="text-center">
              <p className="font-black uppercase tracking-tighter text-sm">
                Signaler un nouveau problème découvert
              </p>

              <p className="text-[11px] font-medium opacity-60 italic">
                Cela ouvrira une nouvelle phase de chiffrage et de travaux
              </p>
            </div>
          </button>
        </div>

        {/* COLONNE DROITE : RÉSUMÉ FINANCIER GLOBAL */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">

            {/* Carte Totale Noire */}
            <Card className="p-6 bg-slate-900 text-white border-none shadow-2xl rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <FileText size={80} />
              </div>

              <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-8">
                Résumé Financier Dossier
              </h3>

              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">
                    Total HT {dossier.interventions.length} phases
                  </span>

                  <span className="font-mono font-bold">
                    {totalHT.toLocaleString('fr-FR')} €
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">TVA 20%</span>

                  <span className="font-mono">
                    {tva.toLocaleString('fr-FR')} €
                  </span>
                </div>

                <div className="pt-6 border-t border-slate-800">
                  <p className="text-[10px] font-black text-blue-400 uppercase mb-1">
                    Montant Total TTC
                  </p>

                  <p className="text-4xl font-black tracking-tighter">
                    {totalTTC.toLocaleString('fr-FR')} €
                  </p>
                </div>
              </div>
            </Card>

            {/* Actions Globales */}
            <div className="space-y-3">
              {!currentProforma &&
                (dossier.status === CASE_STATUS.RECEIVED || dossier.status === CASE_STATUS.DIAGNOSIS) && (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 h-16 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg flex gap-3"
                    onClick={handleGenerateProforma}
                    disabled={actionLoading}
                  >
                    <FileText size={20} />
                    {actionLoading
                      ? 'Génération...'
                      : 'Générer la proforma'}
                  </Button>
                )}

              {currentProforma && (
                <Button
                  className="w-full bg-slate-900 hover:bg-slate-800 h-14 rounded-xl font-bold flex gap-2 shadow-lg text-white"
                  onClick={() =>
                    router.push(`/billing/proforma/${currentProforma.id}`)
                  }
                  disabled={actionLoading}
                >
                  <FileText size={18} />
                  {currentProforma.status === PROFORMA_STATUS.DRAFT
                    ? 'Ouvrir la proforma pour validation'
                    : 'Voir la proforma'}

                  <span className="ml-auto text-[10px] uppercase opacity-70">
                    {currentProforma.status === PROFORMA_STATUS.DRAFT
                      ? 'Brouillon'
                      : currentProforma.status === PROFORMA_STATUS.ACCEPTED
                        ? 'Acceptée'
                        : currentProforma.status}
                  </span>
                </Button>
              )}

              {dossier.status === 'WAITING_PARTS' && (
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 h-14 rounded-xl font-bold flex gap-2 shadow-lg"
                  onClick={handleStartRepair}
                  disabled={actionLoading}
                >
                  <Play size={18} />
                  {actionLoading ? 'Mise à jour...' : 'Passer en réparation'}
                </Button>
              )}

              {dossier.status === CASE_STATUS.IN_PROGRESS && (
                <div className="p-4 bg-blue-50 border-2 border-blue-100 rounded-2xl flex items-center gap-3 text-blue-700">
                  <Play size={20} className="animate-pulse" />
                  <span className="font-black text-[10px] uppercase tracking-widest">Réparation en cours</span>
                </div>
              )}

              {dossier.status === CASE_STATUS.IN_PROGRESS && (
                <Button
                  className="w-full h-12 rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={handleCompleteCase}
                  disabled={actionLoading}
                >
                  <CheckCircle2 size={18} />
                  Terminer les travaux
                </Button>
              )}
            </div>

            {/* Indicateur de devis envoyé */}
            {dossier.status === 'INVOICED' && (
              <div className="p-4 bg-green-50 border-2 border-green-100 rounded-2xl flex items-center gap-4 animate-pulse">
                <CheckCircle2 className="text-green-600" size={24} />

                <div>
                  <p className="text-xs font-black text-green-900 uppercase">
                    Devis Envoyé
                  </p>

                  <p className="text-[10px] text-green-700 font-medium">
                    En attente de validation client
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

/* ================= ICÔNES LOCALES ================= */

function LayoutList({ size, className }: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /><path d="M14 4h7" /><path d="M14 9h7" /><path d="M14 15h7" /><path d="M14 20h7" />
    </svg>
  );
}

