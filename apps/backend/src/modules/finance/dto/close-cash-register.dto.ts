import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CloseCashRegisterDto {
  @IsNumber({}, {
    message: 'Le montant compte doit \u00eatre un nombre valide.',
  })
  @Min(0, {
    message: 'Le montant compte ne peut pas \u00eatre negatif.',
  })
  closing_amount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
