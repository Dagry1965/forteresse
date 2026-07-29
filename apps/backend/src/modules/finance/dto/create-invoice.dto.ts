import { IsNotEmpty, IsUUID, IsDateString } from 'class-validator';

export class CreateInvoiceDto {
  @IsUUID("4", { message: "L'identifiant du devis (Proforma) est invalide." })
  proforma_id: string;

  @IsDateString({}, { message: "La date d'échéance doit être une date valide." })
  due_date: string;
}

