import { IsEnum, IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';

export enum PaymentMethod {
  CARTE = 'carte',
  ESPECES = 'espÃ¨ces',
  VIREMENT = 'virement',
}

export class CreatePaymentDto {
  @IsUUID("4", { message: "L'identifiant de l'espace de travail est invalide." })
  @IsNotEmpty({ message: "Le workspaceId est obligatoire." })
  workspaceId: string;

  @IsUUID("4", { message: "La facture sÃ©lectionnÃ©e est invalide." })
  @IsNotEmpty({ message: "L'identifiant de la facture est obligatoire." })
  invoice_id: string;

  @IsNumber({}, { message: "Le montant doit Ãªtre un nombre valide." })
  @Min(0.01, { message: "Le montant du paiement doit Ãªtre au moins de 0.01â‚¬." })
  amount: number;

  @IsEnum(PaymentMethod, { 
    message: "La mÃ©thode de paiement doit Ãªtre l'une des suivantes : carte, espÃ¨ces ou virement." 
  })
  method: PaymentMethod;
}

