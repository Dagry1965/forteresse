import { PartialType } from '@nestjs/mapped-types';
import { CreateAppointmentDto } from './create-appointment.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { APPOINTMENT_STATUS } from '../../../../../../shared/constants/status.constants';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
  @IsOptional()
  @IsEnum(APPOINTMENT_STATUS)
  status?: string;
}