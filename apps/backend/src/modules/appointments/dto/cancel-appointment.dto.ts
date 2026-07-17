import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  clientId: string;

  @IsString()
  vehicleId: string;

  @IsString()
  timeSlotId: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}