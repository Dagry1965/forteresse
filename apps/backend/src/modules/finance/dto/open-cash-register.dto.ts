import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class OpenCashRegisterDto {
  @IsNumber({}, {
    message: 'Le fond de caisse doit \u00eatre un nombre valide.',
  })
  @Min(0, {
    message: 'Le fond de caisse ne peut pas \u00eatre negatif.',
  })
  opening_amount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
