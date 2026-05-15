import { IsOptional, IsString, IsUUID, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetPrescriptionItemFilterDto {
  @IsOptional()
  @IsUUID('4', { message: 'El ID debe ser un UUID válido' })
  id?: string;

  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto' })
  name?: string;

  @IsOptional()
  @IsUUID('4', { message: 'El prescriptionId debe ser un UUID válido' })
  prescriptionId?: string;

  @IsOptional()
  @Type(() => Number) // <--- CRÍTICO: Convierte string a number
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página mínima es 1' })
  page: number = 1;

  @IsOptional()
  @Type(() => Number) // <--- CRÍTICO: Convierte string a number
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite mínimo es 1' })
  limit: number = 10;
}
