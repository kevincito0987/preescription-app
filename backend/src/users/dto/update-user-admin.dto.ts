import { IsOptional, IsString, IsEnum, IsIn } from 'class-validator';
import { Role } from '@prisma/client'; // Importamos el Enum directamente de Prisma

export class UpdateUserAdminDto {
  @IsOptional()
  @IsEnum(Role, {
    message:
      'El rol debe ser uno de los siguientes valores: ADMIN, DOCTOR, PATIENT',
  })
  role?: Role; // Ahora solo acepta valores válidos del Enum

  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE', 'SUSPENDED'], {
    message: 'El estado debe ser ACTIVE, INACTIVE o SUSPENDED',
  })
  status?: string;
}
