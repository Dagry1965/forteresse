import { IsEmail, IsOptional, IsString, IsUUID, IsIn } from 'class-validator';

export class CreateClientDto {
  @IsUUID()
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