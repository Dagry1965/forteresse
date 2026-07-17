import { IsOptional, IsUUID } from 'class-validator';

export class InventoryFilterDto {
  @IsOptional()
  @IsUUID()
  workspace_id?: string;
}
