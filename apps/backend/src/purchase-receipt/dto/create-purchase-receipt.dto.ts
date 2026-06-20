import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePurchaseReceiptLineDto } from './create-purchase-receipt-line.dto';

export class CreatePurchaseReceiptDto {
  @IsUUID()
  purchaseOrderId: string;

  @IsUUID()
  workspaceId: string;

  @IsString()
  @IsNotEmpty()
  reference: string; // Numéro de BL / Référence de réception

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseReceiptLineDto)
  lines: CreatePurchaseReceiptLineDto[];
}
