import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested, IsArray, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

class ProformaLineDto {
  @IsOptional()
  @IsUUID()
  product_id?: string;

  @IsString()
  @IsNotEmpty({ message: "La description de la ligne est obligatoire." })
  description: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unit_price: number;
}

export class CreateProformaDto {
  @IsUUID("4", { message: "L'identifiant de l'intervention est invalide." })
  intervention_id: string;

  @IsArray()
  @ArrayMinSize(1, { message: "Le devis doit contenir au moins une ligne." })
  @ValidateNested({ each: true })
  @Type(() => ProformaLineDto)
  lines: ProformaLineDto[];
}
