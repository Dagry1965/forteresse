import { IsEmail, IsOptional, IsString, IsIn } from 'class-validator';

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
}