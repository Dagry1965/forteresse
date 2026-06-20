import { IsNotEmpty, IsNumber, IsString, Min, IsUUID, IsOptional } from 'class-validator';

export class CreateProductDto {
  @IsUUID("4", { message: "L'identifiant de l'espace de travail est invalide." })
  workspaceId: string;

  @IsOptional()
  @IsUUID("4", { message: "Le fournisseur sélectionné est invalide." })
  supplier_id?: string;

  @IsString({ message: "La référence doit être une chaîne de caractères." })
  @IsNotEmpty({ message: "La référence de la pièce est obligatoire." })
  reference: string;

  @IsString({ message: "Le nom du produit doit être une chaîne de caractères." })
  @IsNotEmpty({ message: "Le nom du produit est obligatoire." })
  name: string;

  @IsNumber({}, { message: "Le prix d'achat doit être un nombre valide." })
  @Min(0, { message: "Le prix d'achat ne peut pas être négatif." })
  purchase_price: number;

  @IsNumber({}, { message: "Le prix de vente doit être un nombre valide." })
  @Min(0, { message: "Le prix de vente ne peut pas être négatif." })
  selling_price: number;

  @IsNumber({}, { message: "Le seuil d'alerte doit être un nombre valide." })
  @Min(0, { message: "Le seuil d'alerte ne peut pas être négatif." })
  min_stock_alert: number;
}
