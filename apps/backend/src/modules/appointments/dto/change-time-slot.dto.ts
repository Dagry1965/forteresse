import { IsString, IsNotEmpty } from 'class-validator';

export class ChangeTimeSlotDto {
  @IsString()
  @IsNotEmpty()
  timeSlotId: string;
}