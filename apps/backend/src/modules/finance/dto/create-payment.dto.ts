import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  PAYMENT_METHOD,
} from '../../../../../../shared/constants/status.constants';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty({
    message: 'L\u2019identifiant de la facture est obligatoire.',
  })
  invoice_id: string;

  @IsNumber({}, {
    message: 'Le montant doit \u00eatre un nombre valide.',
  })
  @Min(0.01, {
    message: 'Le montant du paiement doit \u00eatre au moins de 0.01.',
  })
  amount: number;

  @IsIn(Object.values(PAYMENT_METHOD), {
    message: 'Le moyen de paiement est invalide.',
  })
  method: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
