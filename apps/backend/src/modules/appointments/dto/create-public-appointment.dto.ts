import {
  IsUUID,
  IsOptional,
  IsIn,
  IsDateString,
} from 'class-validator';
import { APPOINTMENT_STATUS } from '../../../../../../shared/constants/status.constants';

export class UpdateAppointmentDto {
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @IsOptional()
  @IsUUID()
  timeSlotId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsIn(Object.values(APPOINTMENT_STATUS))
  status?: string;
}