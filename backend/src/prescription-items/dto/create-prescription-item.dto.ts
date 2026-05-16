import { IsString, IsOptional, IsInt, IsNotEmpty, Min } from 'class-validator';

// 🟢 IMPORTAMOS EL DECORADOR DE SWAGGER
import { ApiProperty } from '@nestjs/swagger';

export class CreatePrescriptionItemDto {
  @ApiProperty({
    description:
      'ID único (UUIDv4) de la prescripción a la que pertenece este medicamento',
    example: 'a6b8c2d4-e2f4-4a6b-8c2d-4e2f4a6b8c2d',
  })
  @IsNotEmpty({ message: 'El ID de la prescripción es obligatorio' })
  prescriptionId: string;

  @ApiProperty({
    description: 'Nombre comercial o genérico del medicamento',
    example: 'Acetaminofén 500mg',
  })
  @IsString({ message: 'El nombre del medicamento debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del medicamento es obligatorio' })
  name: string;

  @ApiProperty({
    description: 'Dosificación o concentración asignada al paciente',
    example: '1 tableta',
    required: false,
  })
  @IsString({ message: 'La dosis debe ser texto' })
  @IsOptional()
  dosage?: string;

  @ApiProperty({
    description: 'Cantidad total de unidades o cajas a suministrar',
    example: 10,
    minimum: 1,
    required: false,
  })
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @IsOptional()
  @Min(1, { message: 'La cantidad mínima es 1' })
  quantity?: number;

  @ApiProperty({
    description:
      'Instrucciones detalladas de administración (Frecuencia, duración, etc.)',
    example: 'Tomar cada 6 horas por 5 días después de las comidas',
  })
  @IsString({ message: 'Las instrucciones deben ser texto' })
  @IsNotEmpty({ message: 'Las instrucciones son obligatorias' })
  instructions: string;
}
