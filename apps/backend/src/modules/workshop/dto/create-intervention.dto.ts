import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';
import {
  INTERVENTION_PRIORITY,
  QUALITY_CONTROL_STATUS,
} from '../../../../../../shared/constants/status.constants';

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
  @IsString()
  @IsNotEmpty()
  mechanic_id?: string;

  @IsOptional()
  @IsEnum(INTERVENTION_PRIORITY)
  priority?: string;

  @IsOptional()
  @IsString()
  diagnostic?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  planned_minutes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  actual_minutes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  hourly_rate?: number;

  @IsOptional()
  @IsEnum(QUALITY_CONTROL_STATUS)
  quality_control_status?: string;

  @IsOptional()
  @IsString()
  quality_control_notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({
    each: true,
  })
  @Type(() => InterventionPartDto)
  parts?: InterventionPartDto[];
}

