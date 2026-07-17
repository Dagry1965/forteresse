import { IsString, IsUUID } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsString()
  email: string;

  @IsUUID()
  workspace_id: string;
}
