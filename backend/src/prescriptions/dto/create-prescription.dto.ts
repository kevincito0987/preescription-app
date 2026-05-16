import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePrescriptionItemDto } from './create-prescription-item.dto';

export class CreatePrescriptionDto {
  @IsNotEmpty()
  @IsEmail()
  patientEmail: string; // Regla de negocio: Buscar por email

  @IsOptional()
  @IsString()
  notes?: string; // Notas opcionales del diagnóstico o receta

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true }) // 🟢 Corregido: Quitamos el "honesty" intruso
  @Type(() => CreatePrescriptionItemDto)
  items: CreatePrescriptionItemDto[]; // Arreglo de medicamentos
}
