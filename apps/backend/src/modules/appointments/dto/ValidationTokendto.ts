import { IsString } from 'class-validator';

export class ValidationTokenDto {
  @IsString()
  token: string;
}
