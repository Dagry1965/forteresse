'use client';

import React, { useEffect, useState } from 'react';
import { financeService } from '@/services/financeService';
import { Card } from '@/components/ui/card';
import { AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function PaymentReminders() {
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReminders = async () => {
      try {
        const workspaceId = localStorage.getItem("current_workspace_id") ?? undefined;
        const data = await financeService.getOverdueReminders(workspaceId);
        setReminders(data || []);
      } catch (error) {
        console.error("Erreur chargement rappels:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReminders();
  }, []);

  // ðŸ‘‰ Fonction Encaisser
const handleQuickPay = async (scheduleId: string) => {
  try {
    // On appelle le service frontend qui, lui, appellera l'API
    await financeService.recordPayment({
      schedule_id: scheduleId,
      method: 'CB', 
      user_id: 'votre-id-user' // Ã€ dynamiser plus tard avec l'auth
    });
    
    toast.success("Paiement encaissÃ© avec succÃ¨s !");
    // On recharge la page pour mettre Ã  jour le dashboard
    window.location.reload();
  } catch (err: any) {
    toast.error("Erreur lors de l'encaissement");
    console.error(err);
  }
};


  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-slate-500">Chargement des relances...</p>
      </Card>
    );
  }

  if (!reminders.length) {
    return (
      <Card className="p-6 flex items-center gap-3 text-slate-600">
        <Clock size={20} className="text-blue-500" />
        <span>Aucune relance Ã  effectuer</span>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4 border-red-200 shadow-sm">
      <div className="flex items-center gap-2 text-red-600 font-bold">
        <AlertTriangle size={20} />
        Relances financiÃ¨res urgentes
      </div>

      <div className="space-y-3">
        {reminders.map((reminder: any) => (
          <div
            key={reminder.id}
            className="p-4 bg-red-50 border border-red-200 rounded-xl flex justify-between items-center"
          >
            <div>
              <p className="font-black text-slate-900 leading-tight">
                {reminder.invoice?.client?.name || "Client Ã  identifier"}
              </p>

              <p className="text-[10px] text-slate-500 font-bold uppercase">
                Facture {reminder.invoice?.reference || "RÃ©fÃ©rence inconnue"}
              </p>
            </div>

            <div className="text-right">
              <p className="text-red-600 font-black text-lg">
                {reminder.amount?.toLocaleString()} â‚¬
              </p>

              <p className="text-xs text-slate-500">Ã‰chÃ©ance dÃ©passÃ©e</p>
              <p className="text-sm font-bold text-red-700">
                {reminder.due_date
                  ? new Date(reminder.due_date).toLocaleDateString()
                  : "Date inconnue"}
              </p>

              {/* ðŸ‘‰ Bouton Encaisser */}
              <Button
                className="mt-2"
                onClick={() => handleQuickPay(reminder.id)}
              >
                Encaisser
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

