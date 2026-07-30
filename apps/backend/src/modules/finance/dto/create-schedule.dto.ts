import {
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
} from 'class-validator';

export class CreateScheduleDto {
  @IsString()
  @IsNotEmpty()
  invoice_id: string;

  @IsInt()
  @Min(1)
  installments: number;

  @IsInt()
  @Min(1)
  interval_days: number;
}
