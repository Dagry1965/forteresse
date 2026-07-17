import { IsString, IsUUID, IsDateString } from 'class-validator';

export class PublicAppointmentDto {
  @IsUUID()
  workspace_id: string;

  @IsUUID()
  client_id: string;

  @IsUUID()
  vehicle_id: string;

  @IsUUID()
  time_slot_id: string;

  @IsDateString()
  date: string;

  @IsString()
  validationToken: string;

  @IsDateString()
  validationTokenExpires: string;
}
