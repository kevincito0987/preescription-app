import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

// Clase base con lo que todos comparten
export class CreateUserBaseDto {
  @IsEmail({}, { message: 'Formato de correo inválido' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6, { message: 'La clave debe tener al menos 6 caracteres' })
  password: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;
}
