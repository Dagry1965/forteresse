import { IsEmail, IsIn, IsString } from 'class-validator';
import {
  USER_ROLE,
} from '../../../../../../shared/constants/status.constants';
import type {
  UserRole,
} from '../../common/types/statuses.types';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  name: string;

  @IsIn(Object.values(USER_ROLE), {
    message: 'Le r\u00f4le utilisateur est invalide.',
  })
  role: UserRole;
}
