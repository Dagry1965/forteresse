import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  PAYMENT_METHOD,
} from '../../../../../../shared/constants/status.constants';

export class RecordSchedulePaymentDto {
  @IsString()
  @IsNotEmpty()
  schedule_id: string;

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
