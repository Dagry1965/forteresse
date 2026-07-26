import {
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsIn(['INDIVIDUAL', 'COMPANY'])
  type?: 'INDIVIDUAL' | 'COMPANY';

  @IsOptional()
  @IsString()
  company_name?: string;

  @IsOptional()
  @IsString()
  trade_name?: string;

  @IsOptional()
  @IsString()
  registration_number?: string;

  @IsOptional()
  @IsString()
  vat_number?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  billing_address?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  payment_terms_days?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  credit_limit?: number;
}
