import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class PublicBookingDto {
  @IsString() @IsNotEmpty() workspaceId: string;
  @IsString() @IsNotEmpty() name: string;
  @IsEmail() email: string;
  @IsString() @IsNotEmpty() phone: string;
  @IsString() @IsNotEmpty() plateNumber: string;
  @IsString() @IsNotEmpty() make: string;
  @IsString() @IsNotEmpty() model: string;
  @IsString() @IsNotEmpty() scheduled_at: string;
  @IsString() @IsOptional() description: string;
}
