import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

// 🟢 IMPORTAMOS EL DECORADOR DE SWAGGER
import { ApiProperty } from '@nestjs/swagger';

// Clase base con lo que todos comparten
export class CreateUserBaseDto {
  @ApiProperty({
    description: 'Correo electrónico único para el registro e inicio de sesión',
    example: 'paciente.ejemplo@correo.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Formato de correo inválido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  email: string;

  @ApiProperty({
    description: 'Contraseña segura de acceso (Mínimo 6 caracteres)',
    example: 'Password2026*',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'La clave debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({
    description: 'Nombre completo del usuario (Nombres y Apellidos)',
    example: 'Kevin Stiven Angarita',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
  fullName: string;
}
