import { 
  IsArray, 
  IsNotEmpty, 
  IsNumber, 
  IsOptional, 
  IsString, 
  ValidateNested, 
  IsUUID, 
  ArrayMinSize 
} from 'class-validator';
import { Type } from 'class-transformer';

class PurchaseOrderLineDto {
  @IsUUID("4", { message: "L'identifiant du produit est invalide." })
  productId: string;

  @IsNumber({}, { message: "La quantité doit être un nombre valide." })
  quantity: number;

  @IsNumber({}, { message: "Le prix unitaire doit être un nombre valide." })
  unit_price: number;
}

export class CreatePurchaseOrderDto {
  @IsUUID("4", { message: "L'identifiant de l'espace de travail est invalide." })
  workspaceId: string;

  @IsUUID("4", { message: "Veuillez sélectionner un fournisseur dans la liste." })
  supplierId: string;

  @IsString({ message: "La référence doit être une chaîne de caractères." })
  @IsNotEmpty({ message: "La référence du bon de commande est obligatoire." })
  reference: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber({}, { message: "Le montant total doit être un nombre." })
  totalAmount?: number;

  @IsArray({ message: "Le format des lignes de commande est incorrect." })
  @ArrayMinSize(1, { message: "Le Bon de Commande doit contenir au moins un produit." })
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderLineDto)
  lines: PurchaseOrderLineDto[];
}
