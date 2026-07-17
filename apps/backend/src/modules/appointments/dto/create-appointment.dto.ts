// dto/create-appointment.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateIf,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  @IsOptional()
  @IsString()
  date?: string;

  // === Validation conditionnelle ===
  @ValidateIf((o) => !o.startTime && !o.endTime)
  @IsString()
  @IsNotEmpty({ message: 'Vous devez fournir soit timeSlotId, soit startTime + endTime' })
  timeSlotId?: string;

  @ValidateIf((o) => !o.timeSlotId)
  @IsString()
  @IsNotEmpty({ message: 'startTime est requis' })
  startTime?: string;

  @ValidateIf((o) => !o.timeSlotId)
  @IsString()
  @IsNotEmpty({ message: 'endTime est requis' })
  endTime?: string;
}
