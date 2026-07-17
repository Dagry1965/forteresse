import { IsEnum, IsOptional, IsString } from 'class-validator';
import { INTERVENTION_STATUS } from '../../../../../../shared/constants/status.constants';

export class UpdateInterventionDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(INTERVENTION_STATUS)
  status?: string;
}
