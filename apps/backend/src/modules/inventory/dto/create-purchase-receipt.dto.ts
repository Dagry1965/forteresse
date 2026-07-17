import { 
  IsArray, 
  IsNotEmpty, 
  IsString, 
  IsNumber, 
  ValidateNested, 
  ArrayMinSize,
  Min
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Détail de chaque article reçu
 */
export class ReceiptLineDto {
  @IsString()
  @IsNotEmpty()
  itemId: string; // ID du produit (StockItem)

  @IsNumber()
  @Min(1, { message: "La quantité reçue doit être au moins de 1" })
  quantity: number; // Quantité livrée par le fournisseur
}

/**
 * Objet principal pour créer un bon de réception
 */
export class CreatePurchaseReceiptDto {
  @IsString()
  @IsNotEmpty()
  purchaseOrderId: string; // ID de la commande d'origine

  @IsString()
  @IsNotEmpty()
  reference: string; // Numéro du Bon de Livraison (BL) du fournisseur

  @IsArray()
  @ArrayMinSize(1, { message: "Le bon de réception doit contenir au moins un article." })
  @ValidateNested({ each: true })
  @Type(() => ReceiptLineDto)
  items: ReceiptLineDto[];
}
