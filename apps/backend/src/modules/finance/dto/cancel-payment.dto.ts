import {
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class CancelPaymentDto {
  @IsString()
  @IsNotEmpty({
    message: 'Le motif d\u2019annulation est obligatoire.',
  })
  reason: string;
}
