import { IsUUID } from 'class-validator';

export class GetStockAlertsDto {
  @IsUUID("4", { message: "L'identifiant de l'espace de travail est invalide." })
  workspaceId: string;
}
