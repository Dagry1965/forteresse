import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { TIME_SLOT_STATUS } from '../../../../../../shared/constants/status.constants';
export class FilterTimeslotDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsEnum(TIME_SLOT_STATUS)
  status?: string;
}