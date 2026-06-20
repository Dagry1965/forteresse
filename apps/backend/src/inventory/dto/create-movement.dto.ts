import { IsEnum, IsNotEmpty, IsNumber, IsString, IsUUID, Min } from 'class-validator';

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
}

export class CreateMovementDto {
  @IsUUID("4", { message: "L'identifiant de l'espace de travail est invalide." })
  workspaceId: string;

  @IsUUID("4", { message: "L'identifiant du produit est invalide." })
  product_id: string;

  @IsEnum(MovementType, { message: "Le type de mouvement doit être 'IN' ou 'OUT'." })
  type: MovementType;

  @IsNumber({}, { message: "La quantité doit être un nombre." })
  @Min(1, { message: "La quantité doit être supérieure à 0." })
  quantity: number;

  @IsString()
  @IsNotEmpty({ message: "Le motif du mouvement est obligatoire." })
  reason: string;
}
