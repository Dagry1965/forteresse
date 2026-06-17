import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

class PurchaseOrderLineDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unit_price: number;
}

export class CreatePurchaseOrderDto {
  @IsUUID()
  workspaceId: string;

  @IsUUID()
  supplierId: string;

  @IsString()
  @IsNotEmpty()
  reference: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderLineDto)
  lines: PurchaseOrderLineDto[];
}