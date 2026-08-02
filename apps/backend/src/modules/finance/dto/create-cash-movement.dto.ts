import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  CASH_MOVEMENT_TYPE,
} from '../../../../../../shared/constants/status.constants';

const MANUAL_MOVEMENT_TYPES = [
  CASH_MOVEMENT_TYPE.CASH_IN,
  CASH_MOVEMENT_TYPE.CASH_OUT,
] as const;

export class CreateCashMovementDto {
  @IsIn(MANUAL_MOVEMENT_TYPES, {
    message: 'Le type de mouvement doit etre CASH_IN ou CASH_OUT.',
  })
  type: string;

  @IsNumber({}, {
    message: 'Le montant doit \u00eatre un nombre valide.',
  })
  @Min(0.01, {
    message: 'Le montant doit \u00eatre au moins de 0.01.',
  })
  amount: number;

  @IsString()
  @IsNotEmpty({
    message: 'Le motif du mouvement est obligatoire.',
  })
  notes: string;

  @IsOptional()
  @IsString()
  reference?: string;
}
