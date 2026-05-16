import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';

export class GetMyPrescriptionsFilterDto {
  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;

  @IsOptional()
  @IsString()
  doctorName?: string;

  // 🟢 NUEVOS FILTROS PARA EL ADMIN
  @IsOptional()
  @IsString()
  status?: string; // 'pending' | 'consumed'

  @IsOptional()
  @IsDateString()
  startDate?: string; // Fecha inicial (YYYY-MM-DD)

  @IsOptional()
  @IsDateString()
  endDate?: string; // Fecha final (YYYY-MM-DD)
}
