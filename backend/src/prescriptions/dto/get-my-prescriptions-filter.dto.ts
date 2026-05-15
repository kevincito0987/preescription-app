import { IsOptional, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetMyPrescriptionsFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  // 🟢 AGREGA ESTO: Así el ValidationPipe ya no rebotará con un 400
  @IsOptional()
  @IsString()
  doctorName?: string;
}
