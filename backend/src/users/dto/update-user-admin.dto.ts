import { IsOptional, IsString, IsEnum, IsIn } from 'class-validator';
import { Role } from '@prisma/client';

import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserAdminDto {
  @ApiProperty({
    description: 'Asigna un nuevo rol al usuario dentro del sistema',
    enum: Role,
    required: false,
    example: 'doctor', // 👈 🟢 CORRECCIÓN: Usamos el valor en minúscula string o Role.doctor para que coincida con Prisma
  })
  @IsOptional()
  @IsEnum(Role, {
    message:
      'El rol debe ser uno de los siguientes valores: admin, doctor, patient', // Tip: Ajusta el mensaje si tus roles son en minúscula
  })
  role?: Role;

  @ApiProperty({
    description: 'Estado administrativo de la cuenta del usuario',
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    required: false,
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE', 'SUSPENDED'], {
    message: 'El estado debe ser ACTIVE, INACTIVE o SUSPENDED',
  })
  status?: string;
}
