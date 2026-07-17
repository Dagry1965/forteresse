import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

export class InterventionPartDto {
  @IsString()
  @IsNotEmpty()
  item_id: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  /**
   * Facultatif :
   * si absent, le service utilise le prix de vente actuel
   * de l'article comme prix figé.
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price_snapshot?: number;
}

export class CreateInterventionDto {
  /**
   * Relation réellement utilisée par le modèle Intervention.
   */
  @IsString()
  @IsNotEmpty()
  case_id: string;

  /**
   * Conservé pour compatibilité avec le frontend existant.
   *
   * Le modèle Prisma Intervention ne contient cependant
   * aucun champ appointment_id.
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  appointment_id?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({
    each: true,
  })
  @Type(() => InterventionPartDto)
  parts?: InterventionPartDto[];
}

