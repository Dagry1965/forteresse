// dto/get-available-slots.dto.ts
import { IsDateString } from 'class-validator';

export class GetAvailableSlotsDto {
  @IsDateString()
  date: string;
}