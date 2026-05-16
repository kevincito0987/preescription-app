import { IsNotEmpty, IsString } from 'class-validator';

// 🟢 IMPORTAMOS EL DECORADOR DE SWAGGER
import { ApiProperty } from '@nestjs/swagger';

export class CreatePrescriptionItemDto {
  @ApiProperty({
    description: 'Nombre comercial o genérico del medicamento',
    example: 'Amoxicilina',
  })
  @IsNotEmpty({ message: 'El nombre del medicamento es obligatorio' })
  @IsString({ message: 'El nombre del medicamento debe ser texto' })
  name: string;

  @ApiProperty({
    description: 'Concentración o gramaje requerido para la dosis',
    example: '500mg',
  })
  @IsNotEmpty({ message: 'La dosis es obligatoria' })
  @IsString({ message: 'La dosis debe ser texto' })
  dosis: string;

  @ApiProperty({
    description: 'Cantidad total de unidades a suministrar',
    example: '20 tabletas',
  })
  @IsNotEmpty({ message: 'La cantidad es obligatoria' })
  @IsString({ message: 'La cantidad debe ser texto' })
  cantidad: string;

  @ApiProperty({
    description: 'Instrucciones precisas de administración y frecuencia',
    example: 'Tomar 1 cápsula cada 8 horas por 7 días',
  })
  @IsNotEmpty({ message: 'Las indicaciones son obligatorias' })
  @IsString({ message: 'Las indicaciones deben ser texto' })
  indicaciones: string;
}
