import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSupplierDto {
  @IsUUID("4", { message: "L'identifiant de l'espace de travail est invalide." })
  workspaceId: string;

  @IsString()
  @IsNotEmpty({ message: "Le nom du fournisseur est obligatoire." })
  name: string;

  @IsOptional()
  @IsEmail({}, { message: "L'adresse email du fournisseur n'est pas valide." })
  email?: string;

  @IsOptional()
  @IsString({ message: "Le numéro de téléphone doit être une chaîne de caractères." })
  phone?: string;
}
