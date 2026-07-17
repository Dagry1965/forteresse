// create-user.dto.ts
import { IsEmail, IsString, IsUUID } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  name: string;

  @IsString()
  role: string;

  @IsUUID()
  workspace_id: string;
}
