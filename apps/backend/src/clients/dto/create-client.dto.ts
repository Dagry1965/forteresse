import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class CreateClientDto {
  @IsUUID("4", { message: "L'identifiant de l'espace de travail est invalide." })
  workspaceId: string;

  @IsString({ message: "Le nom doit être une chaîne de caractères." })
  @IsNotEmpty({ message: "Le nom du client est obligatoire." })
  name: string;

  @IsOptional()
  @IsEmail({}, { message: "L'adresse email saisie est invalide." })
  email?: string;

  @IsString({ message: "Le numéro de téléphone doit être une chaîne de caractères." })
  @IsNotEmpty({ message: "Le numéro de téléphone est obligatoire." })
  @Matches(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/, { 
    message: "Le format du numéro de téléphone est incorrect." 
  })
  phone: string;
}
