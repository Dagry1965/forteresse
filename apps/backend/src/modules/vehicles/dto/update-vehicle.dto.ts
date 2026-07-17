import { IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { VEHICLE_STATUS } from '../../../../../../shared/constants/status.constants';

export class UpdateVehicleDto {
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  registration?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  brand?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  model?: string;

  @IsOptional()
  @IsString()
  year?: string;

  @IsOptional()
  @IsString()
  vin?: string;

  @IsOptional()
  @IsIn(Object.values(VEHICLE_STATUS))
  status?: string;
}