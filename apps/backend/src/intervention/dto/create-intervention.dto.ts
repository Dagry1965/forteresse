import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateInterventionDto {
  @IsUUID("4", { message: "L'identifiant de l'espace de travail est invalide." })
  @IsNotEmpty({ message: "Le workspaceId est obligatoire." })
  workspaceId: string;

  @IsUUID("4", { message: "L'identifiant du rendez-vous est invalide." })
  @IsNotEmpty({ message: "Le rendez-vous d'origine est obligatoire pour démarrer les travaux." })
  appointment_id: string;

  @IsString({ message: "Le statut doit être une chaîne de caractères." })
  @IsNotEmpty({ message: "Le statut de l'intervention est obligatoire." })
  status: string; // IN_PROGRESS, DIAGNOSIS_DONE, COMPLETED, etc.

  @IsOptional()
  @IsString({ message: "Le texte du diagnostic doit être une chaîne de caractères." })
  diagnosis_text?: string;
}
