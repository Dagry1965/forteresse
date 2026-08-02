import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PROFORMA_LINE_TYPE } from '../../../../../../shared/constants/status.constants';

export class CreateProformaLineDto {
  @IsString()
  @IsIn(Object.values(PROFORMA_LINE_TYPE))
  type: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unit_price: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  vat_rate: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  discount?: number;
}
