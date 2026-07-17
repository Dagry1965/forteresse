export class CreateScheduleDto {
  invoice_id: string;
  installments: number; // Nombre de tranches (ex: 3)
  interval_days: number; // Délai entre tranches (ex: 30 pour un paiement mensuel)
}
