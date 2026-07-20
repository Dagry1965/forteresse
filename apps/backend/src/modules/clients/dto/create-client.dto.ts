import { IsEmail, IsOptional, IsString, IsIn } from 'class-validator';

export class CreateClientDto {
  @IsString()
  workspaceId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsIn(['INDIVIDUAL', 'COMPANY'])
  type?: 'INDIVIDUAL' | 'COMPANY' = 'INDIVIDUAL';
}