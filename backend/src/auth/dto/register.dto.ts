import { CreateUserBaseDto } from '../../users/dto/create-user.dto';

// Simplemente extendemos del base. No agregues el campo 'role' aquí,
// ya que el servicio lo asignará automáticamente como 'patient'.
export class RegisterDto extends CreateUserBaseDto {}
