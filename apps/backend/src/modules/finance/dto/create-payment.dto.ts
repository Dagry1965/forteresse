import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export enum PaymentMethod {
  CARTE = 'carte',
  ESPECES = 'espèces',
  VIREMENT = 'virement',
}

export class CreatePaymentDto {
  @IsUUID('4', {
    message:
      'L’identifiant de l’espace de travail est invalide.',
  })
  @IsNotEmpty({
    message: 'Le workspaceId est obligatoire.',
  })
  workspaceId: string;

  @IsUUID('4', {
    message: 'La facture sélectionnée est invalide.',
  })
  @IsNotEmpty({
    message:
      'L’identifiant de la facture est obligatoire.',
  })
  invoice_id: string;

  @IsNumber({}, {
    message: 'Le montant doit être un nombre valide.',
  })
  @Min(0.01, {
    message:
      'Le montant du paiement doit être au moins de 0.01.',
  })
  amount: number;

  @IsEnum(PaymentMethod, {
    message:
      'La méthode de paiement doit être carte, espèces ou virement.',
  })
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
