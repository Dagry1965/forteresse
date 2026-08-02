import {
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({
    message: 'Le jeton de rafra\u00eechissement est obligatoire.',
  })
  refresh_token: string;
}
