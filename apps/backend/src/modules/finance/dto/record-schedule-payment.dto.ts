import {
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class RecordSchedulePaymentDto {
  @IsString()
  @IsNotEmpty()
  schedule_id: string;

  @IsString()
  @IsNotEmpty()
  method: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
