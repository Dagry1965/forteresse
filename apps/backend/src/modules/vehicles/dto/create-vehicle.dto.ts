import { IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { VEHICLE_STATUS } from '../../../../../../shared/constants/status.constants';

export class CreateVehicleDto {
  @IsUUID()
  clientId: string;

  @IsString()
  workspaceId: string;

  @IsString()
  @MinLength(2)
  registration: string;

  @IsString()
  @MinLength(2)
  brand: string;

  @IsString()
  @MinLength(1)
  model: string;

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