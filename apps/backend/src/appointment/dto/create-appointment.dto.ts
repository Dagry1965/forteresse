import { IsNotEmpty, IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID("4", { message: "L'identifiant de l'espace de travail est invalide." })
  workspaceId: string;

  @IsUUID("4", { message: "L'identifiant de l'utilisateur est invalide." })
  @IsNotEmpty({ message: "L'utilisateur créant le rendez-vous est obligatoire." })
  user_id: string;

  @IsUUID("4", { message: "Le véhicule sélectionné est invalide." })
  @IsNotEmpty({ message: "Le véhicule est obligatoire pour prendre rendez-vous." })
  vehicle_id: string;

  @IsDateString({}, { message: "La date et l'heure du rendez-vous sont incorrectes." })
  @IsNotEmpty({ message: "La date du rendez-vous est obligatoire." })
  scheduled_at: string;

  @IsString({ message: "La description doit être une chaîne de caractères." })
  @IsNotEmpty({ message: "La description du motif est obligatoire." })
  initial_description: string;

  @IsOptional()
  @IsString({ message: "Le statut doit être une chaîne de caractères." })
  status?: string; // planned, cancelled, completed
}
