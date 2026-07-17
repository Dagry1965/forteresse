'use client';

import React from 'react';
import { useRouter } from 'next/router';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileStack, 
  Banknote, 
  ArrowLeft, 
  ChevronRight,
  TrendingUp,
  Receipt
} from 'lucide-react';

export default function FinanceHubPage() {
  const router = useRouter();

  const menuItems = [
    {
      title: "Facturation Flotte",
      description: "Regrouper plusieurs dossiers pour une entreprise",
      icon: FileStack,
      path: "/finance/fleet",
      color: "bg-blue-500"
    },
    {
      title: "Journal de Caisse",
      description: "Suivi des encaissements et clôture du jour",
      icon: Banknote,
      path: "/finance/cashier",
      color: "bg-green-500"
    },
    {
      title: "Liste des Factures",
      description: "Historique et impression des documents",
      icon: Receipt,
      path: "/finance/invoices", // Vous pourrez créer cette liste plus tard
      color: "bg-purple-500"
    }
  ];

  return (
    <div className="p-10 max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard')}>
          <ArrowLeft size={20} /> Retour Dashboard
        </Button>
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900">Finance</h1>
          <p className="text-slate-500 font-medium">Pilotez la rentabilité et les encaissements du garage</p>
        </div>
      </div>

      {/* Menu en grille */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {menuItems.map((item, index) => (
          <Card 
            key={index}
            onClick={() => router.push(item.path)}
            className="p-8 cursor-pointer hover:shadow-xl transition-all border-slate-100 group flex items-center justify-between"
          >
            <div className="flex items-center gap-6">
              <div className={`${item.color} p-4 rounded-2xl text-white shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform`}>
                <item.icon size={32} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{item.title}</h2>
                <p className="text-slate-500 text-sm">{item.description}</p>
              </div>
            </div>
            <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" size={24} />
          </Card>
        ))}
      </div>

      {/* Petit rappel de performance */}
      <Card className="p-8 bg-slate-900 text-white border-none rounded-3xl flex justify-between items-center overflow-hidden relative">
        <div className="relative z-10">
          <p className="text-blue-400 font-black uppercase text-xs tracking-widest mb-2">Conseil de gestion</p>
          <h3 className="text-xl font-bold max-w-md leading-relaxed">
            Consultez régulièrement votre <span className="text-blue-400">Journal de Caisse</span> pour éviter les écarts en fin de mois.
          </h3>
        </div>
        <TrendingUp size={120} className="absolute -right-4 -bottom-4 text-white/5" />
      </Card>
    </div>
  );
}
