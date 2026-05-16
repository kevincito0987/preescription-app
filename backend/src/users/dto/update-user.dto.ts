import { IsOptional, IsString, IsEmail, MinLength } from 'class-validator';

// 🟢 IMPORTAMOS EL DECORADOR DE SWAGGER
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Nuevo nombre completo del usuario si desea modificarlo',
    example: 'Kevin Stiven Angarita Caamaño',
    required: false,
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({
    description: 'Nuevo correo electrónico (debe ser único si se cambia)',
    example: 'nuevo.correo@ejemplo.com',
    format: 'email',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'El formato del correo es inválido' })
  email?: string;

  @ApiProperty({
    description: 'Nueva contraseña de acceso (mínimo 6 caracteres)',
    example: 'NewSecurePass2026*',
    minLength: 6,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password?: string;

  @ApiProperty({
    description:
      'Rol del usuario dentro del sistema. Aunque es visible aquí, está protegido en los endpoints de usuarios comunes.',
    enum: ['admin', 'doctor', 'patient'],
    required: false,
    example: 'patient',
  })
  @IsOptional()
  @IsString()
  role?: string;
}
