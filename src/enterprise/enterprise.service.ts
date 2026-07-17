async getDashboard(companyId: string) {
  const now = new Date();
  const year = now.getFullYear();

  const invoices = await this.invoiceRepo.find({
    where: { companyId, createdAt: Between(`${year}-01-01`, `${year}-12-31`) },
    relations: ["vehicle"],
  });

  const interventions = await this.interventionRepo.find({
    where: { companyId },
  });

  const vehicles = await this.vehicleRepo.find({
    where: { companyId },
  });

  // CA mensuel
  const monthlyRevenue = Array(12).fill(0);
  invoices.forEach((inv) => {
    const m = new Date(inv.createdAt).getMonth();
    monthlyRevenue[m] += Number(inv.totalTTC);
  });

  // Interventions mensuelles
  const monthlyInterventions = Array(12).fill(0);
  interventions.forEach((i) => {
    const m = new Date(i.createdAt).getMonth();
    monthlyInterventions[m]++;
  });

  return {
    kpis: {
      totalRevenue: invoices.reduce((s, i) => s + Number(i.totalTTC), 0),
      totalInterventions: interventions.length,
      fleetSize: vehicles.length,
      avgRevenuePerIntervention:
        invoices.length > 0
          ? invoices.reduce((s, i) => s + Number(i.totalTTC), 0) /
            invoices.length
          : 0,
    },
    charts: {
      monthlyRevenue,
      monthlyInterventions,
    },
    vehicles,
  };
}
