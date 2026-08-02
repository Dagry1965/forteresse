import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';

export class RefundPaymentDto {
  @IsNumber({}, {
    message: 'Le montant du remboursement doit \u00eatre valide.',
  })
  @Min(0.01, {
    message: 'Le remboursement doit \u00eatre au moins de 0.01.',
  })
  amount: number;

  @IsString()
  @IsNotEmpty({
    message: 'Le motif du remboursement est obligatoire.',
  })
  reason: string;
}
