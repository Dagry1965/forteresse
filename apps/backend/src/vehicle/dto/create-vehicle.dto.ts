import { IsNotEmpty, IsOptional, IsString, IsUUID, Length, Matches, IsNumber } from 'class-validator';

export class CreateVehicleDto {
  @IsUUID("4", { message: "L'identifiant de l'espace de travail est invalide." })
  workspaceId: string;

  @IsUUID("4", { message: "Le client sélectionné est invalide." })
  @IsNotEmpty({ message: "Le propriétaire du véhicule est obligatoire." })
  clientId: string;

  @IsOptional()
  @IsString({ message: "Le numéro VIN doit être une chaîne de caractères." })
  @Length(17, 17, { message: "Le numéro VIN (châssis) doit comporter exactement 17 caractères." })
  vin?: string;

  @IsString({ message: "La plaque d'immatriculation doit être une chaîne de caractères." })
  @IsNotEmpty({ message: "La plaque d'immatriculation est obligatoire." })
  @Matches(/^[A-Z0-9-]{4,12}$/i, { message: "Le format de la plaque d'immatriculation est incorrect." })
  plateNumber: string;

  @IsString({ message: "La marque doit être une chaîne de caractères." })
  @IsNotEmpty({ message: "La marque du véhicule est obligatoire." })
  make: string;

  @IsString({ message: "Le modèle doit être une chaîne de caractères." })
  @IsNotEmpty({ message: "Le modèle du véhicule est obligatoire." })
  model: string;

  @IsOptional()
  @IsNumber({}, { message: "L'année doit être un nombre valide." })
  year?: number;

  @IsOptional()
  @IsNumber({}, { message: "Le kilométrage doit être un nombre valide." })
  mileage?: number;
}
