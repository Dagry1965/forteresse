async getGarageDashboard(workspaceId: string) {
  const now = new Date();
  const year = now.getFullYear();

  // Dates de début et fin d'année (plus fiable que les strings)
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

  const interventions = await this.interventionRepo.find({
    where: {
      workspaceId,
      createdAt: Between(startOfYear, endOfYear),
    },
    relations: ['vehicle'],
  });

  const invoices = await this.invoiceRepo.find({
    where: {
      workspaceId,
      createdAt: Between(startOfYear, endOfYear),
    },
  });

  // CA mensuel
  const monthlyRevenue = Array(12).fill(0);
  invoices.forEach((inv) => {
    const m = new Date(inv.createdAt).getMonth();
    monthlyRevenue[m] += Number(inv.totalTTC || 0);
  });

  // Interventions par statut
  const totalInterventions = interventions.length;
  const planned = interventions.filter((i) => i.status === 'PLANNED').length;
  const inProgress = interventions.filter((i) => i.status === 'IN_PROGRESS').length;
  const done = interventions.filter((i) => i.status === 'DONE').length;
  const cancelled = interventions.filter((i) => i.status === 'CANCELLED').length;

  // Taux de transformation (proforma → facture)
  const proformaCount = interventions.filter((i) => i.hasProforma).length;
  const invoicedCount = invoices.length;
  const conversionRate = proformaCount > 0 
    ? (invoicedCount / proformaCount) * 100 
    : 0;

  // Temps moyen d'intervention (en heures)
  const durations = interventions
    .filter((i) => i.startedAt && i.endedAt)
    .map((i) => {
      const start = new Date(i.startedAt).getTime();
      const end = new Date(i.endedAt).getTime();
      return (end - start) / 3600000;
    });

  const avgDuration = durations.length
    ? durations.reduce((sum, d) => sum + d, 0) / durations.length
    : 0;

  // Charge atelier
  const workshopLoad = planned + inProgress;

  return {
    kpis: {
      totalRevenue: invoices.reduce((sum, i) => sum + Number(i.totalTTC || 0), 0),
      totalInterventions,
      workshopLoad,
      avgDuration: Number(avgDuration.toFixed(2)),
      conversionRate: Number(conversionRate.toFixed(1)),
    },
    charts: {
      monthlyRevenue,
    },
    breakdown: {
      planned,
      inProgress,
      done,
      cancelled,
    },
  };
}

async getPlanning(workspaceId: string, date: string) {
  const day = new Date(date);
  
  // Début et fin de journée pour un filtrage plus précis
  const startOfDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const endOfDay = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);

  const slots = await this.timeSlotRepo.find({
    where: {
      workspaceId,
      date: Between(startOfDay, endOfDay),
    },
    relations: ['appointments', 'appointments.vehicle'],
    order: {
      startTime: 'ASC',
    },
  });

  return slots.map((slot) => ({
    id: slot.id,
    start: slot.startTime,
    end: slot.endTime,
    capacity: slot.capacity,
    used: slot.used,
    appointments: slot.appointments.map((a) => ({
      id: a.id,
      vehicle: `${a.vehicle?.make ?? ''} ${a.vehicle?.model ?? ''}`.trim(),
      plate: a.vehicle?.plateNumber ?? '',
      status: a.status,
    })),
  }));
}