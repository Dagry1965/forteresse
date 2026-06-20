import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePurchaseReceiptLineDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unit_price: number;

  @IsOptional()
  @IsString()
  lot?: string;
}
