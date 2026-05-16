import { IsOptional, IsString, IsDateString } from 'class-validator';

// 🟢 IMPORTAMOS EL DECORADOR DE SWAGGER
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetMyPrescriptionsFilterDto {
  @ApiPropertyOptional({
    description: 'Número de página para la segmentación y paginación de los resultados.',
    example: 1,
    default: 1,
  })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: 'Cantidad máxima de recetas a retornar por cada página.',
    example: 10,
    default: 10,
  })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Permite filtrar las recetas ingresando el nombre (parcial o completo) del médico que las emitió.',
    example: 'Dr. Carlos Perez',
  })
  @IsOptional()
  @IsString()
  doctorName?: string;

  // 🟢 NUEVOS FILTROS PARA EL ADMIN / DOCTOR
  @ApiPropertyOptional({
    description: 'Filtra las prescripciones según su estado actual de consumo.',
    enum: ['pending', 'consumed'],
    example: 'pending',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Fecha inicial del rango de búsqueda para auditar la creación de recetas. Formato ISO estándar (AAAA-MM-DD).',
    example: '2026-01-01',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha límite final del rango de búsqueda para auditar la creación de recetas. Formato ISO estándar (AAAA-MM-DD).',
    example: '2026-05-16',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}