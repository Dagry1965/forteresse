import { IsDateString, IsOptional, IsEnum } from 'class-validator';
import { TIME_SLOT_STATUS } from '../../../../../../shared/constants/status.constants';

export class CreateTimeslotDto {
  @IsDateString()
  start: string;

  @IsDateString()
  end: string;

  @IsOptional()
  @IsEnum(TIME_SLOT_STATUS)
  status?: string;
}