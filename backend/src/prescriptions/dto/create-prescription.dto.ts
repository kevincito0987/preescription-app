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

// 🟢 IMPORTAMOS LOS DECORADORES DE SWAGGER
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePrescriptionDto {
  @ApiProperty({
    description:
      'Correo electrónico del paciente al que se le asignará la receta (Se usa para enlazar el usuario automáticamente)',
    example: 'paciente.gonzalez@gmail.com',
    format: 'email',
  })
  @IsNotEmpty({ message: 'El correo electrónico del paciente es obligatorio' })
  @IsEmail({}, { message: 'El formato del correo electrónico no es válido' })
  patientEmail: string;

  @ApiPropertyOptional({
    description:
      'Notas adicionales, diagnóstico general o recomendaciones del médico',
    example: 'Tomar abundante agua y guardar reposo absoluto por 3 días.',
  })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  notes?: string;

  @ApiProperty({
    description:
      'Listado detallado de medicamentos incluidos en la prescripción médica',
    type: [CreatePrescriptionItemDto], // 👈 🟢 CRÍTICO: Le dice a Swagger que es un arreglo estructurado de medicamentos
  })
  @IsNotEmpty({ message: 'La lista de medicamentos no puede estar vacía' })
  @IsArray({ message: 'Los ítems deben venir en formato de arreglo' })
  @ValidateNested({ each: true })
  @Type(() => CreatePrescriptionItemDto)
  items: CreatePrescriptionItemDto[];
}
