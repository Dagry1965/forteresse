import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  INTERVENTION_PRIORITY,
  INTERVENTION_STATUS,
  QUALITY_CONTROL_STATUS,
} from '../../../../../../shared/constants/status.constants';

export class UpdateInterventionDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(INTERVENTION_STATUS)
  status?: string;

  @IsOptional()
  @IsString()
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
}
