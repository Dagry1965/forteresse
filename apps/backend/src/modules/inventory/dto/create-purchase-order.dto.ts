import { IsString, IsArray, ValidateNested, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePurchaseOrderItemDto {
  @IsString()
  stock_item_id: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unit_cost: number;
}

export class CreatePurchaseOrderDto {
  @IsString()
  supplier_id: string;

  @IsOptional()
  @IsString()
  expected_date?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[];
}