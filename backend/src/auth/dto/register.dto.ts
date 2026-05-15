import { CreateUserDto } from '../../users/dto/create-user.dto';
import { OmitType } from '@nestjs/mapped-types';

// Usamos OmitType para heredar TODO excepto el campo 'role'
// Esto evita que un atacante se registre directamente como ADMIN
export class RegisterDto extends OmitType(CreateUserDto, ['role'] as const) {
  // Aquí el usuario solo enviará fullName, email y password
  // Las validaciones de MinLength y IsEmail se mantienen automáticamente
}
