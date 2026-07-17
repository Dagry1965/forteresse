import { IsString, IsUUID, IsNumber } from 'class-validator';

export class CreateInvoiceDto {
  @IsString()
  reference: string;

  @IsNumber()
  total: number;

  @IsString()
  status: string;

  @IsUUID()
  workspace_id: string;

  @IsUUID()
  proforma_id: string;

  @IsUUID()
  appointment_id: string;

  @IsUUID()
  client_id: string;

  @IsUUID()
  user_id: string;
}
