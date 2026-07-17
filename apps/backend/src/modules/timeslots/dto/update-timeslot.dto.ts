import { PartialType } from '@nestjs/mapped-types';
import { CreateTimeslotDto } from './create-timeslot.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { TIME_SLOT_STATUS } from '../../../../../../shared/constants/status.constants';
export class UpdateTimeslotDto extends PartialType(CreateTimeslotDto) {
  @IsOptional()
  @IsEnum(TIME_SLOT_STATUS)
  status?: string;
}