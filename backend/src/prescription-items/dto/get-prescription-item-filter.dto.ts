import { IsOptional, IsString, IsUUID, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

// 🟢 IMPORTAMOS EL DECORADOR DE SWAGGER
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetPrescriptionItemFilterDto {
  @ApiPropertyOptional({
    description: 'Filtrar por el ID único (UUIDv4) del medicamento específico',
    example: 'b3c8c2d4-e2f4-4a6b-8c2d-4e2f4a6b8c2d',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El ID debe ser un UUID válido' })
  id?: string;

  @ApiPropertyOptional({
    description:
      'Buscar medicamentos que coincidan o contengan este nombre (búsqueda parcial)',
    example: 'Ibuprofeno',
  })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto' })
  name?: string;

  @ApiPropertyOptional({
    description:
      'Filtrar todos los medicamentos pertenecientes a una receta médica específica mediante su ID',
    example: 'a6b8c2d4-e2f4-4a6b-8c2d-4e2f4a6b8c2d',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El prescriptionId debe ser un UUID válido' })
  prescriptionId?: string;

  @ApiPropertyOptional({
    description: 'Número de página para la paginación de resultados',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number) // <--- CRÍTICO: Convierte string a number
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página mínima es 1' })
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de registros a retornar por página',
    example: 10,
    default: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number) // <--- CRÍTICO: Convierte string a number
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite mínimo es 1' })
  limit: number = 10;
}
