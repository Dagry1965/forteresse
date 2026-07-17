import { IsUUID, IsArray, IsNumber, IsString } from 'class-validator';

export class CreateGroupedInvoiceDto {
  @IsUUID()
  workspace_id: string;

  @IsUUID()
  client_id: string;

  @IsUUID()
  user_id: string;

  @IsArray()
  appointment_ids: string[];

  @IsNumber()
  total: number;

  @IsString()
  reference: string;
}
