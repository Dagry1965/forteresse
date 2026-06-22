import { IsNotEmpty, IsOptional, IsString, IsUUID, IsDateString, IsEmail } from 'class-validator';

export class CreatePublicAppointmentDto {
  @IsUUID('4', { message: "L'identifiant de l'espace de travail est invalide." })
  @IsNotEmpty({ message: "L'espace de travail est obligatoire." })
  workspaceId: string;

  // pour RDV publics, l'utilisateur interne est optionnel
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de l'utilisateur est invalide." })
  user_id?: string;

  // véhicule optionnel pour réservation publique (peut être rempli plus tard)
  @IsOptional()
  @IsUUID('4', { message: "Le véhicule sélectionné est invalide." })
  vehicle_id?: string;

  @IsDateString({}, { message: "La date et l'heure du rendez-vous sont incorrectes." })
  @IsNotEmpty({ message: "La date du rendez-vous est obligatoire." })
  scheduled_at: string;

  @IsOptional()
  @IsString({ message: "La description doit être une chaîne de caractères." })
  initial_description?: string;

  // statut forcé côté serveur à PENDING pour les réservations publiques,
  // conservé optionnel ici pour compatibilité interne.
  @IsOptional()
  @IsString({ message: "Le statut doit être une chaîne de caractères." })
  status?: string;

  // Informations client (publiques) — nom requis
  @IsString({ message: "Le nom du client doit être une chaîne de caractères." })
  @IsNotEmpty({ message: "Le nom du client est obligatoire." })
  customerName: string;

  @IsOptional()
  @IsEmail({}, { message: "L'email du client est invalide." })
  customerEmail?: string;

  @IsOptional()
  @IsString({ message: "Le téléphone doit être une chaîne de caractères." })
  customerPhone?: string;
}