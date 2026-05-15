import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    const hasRole = requiredRoles.some((role) => user.role?.includes(role));

    if (!hasRole) {
      // Mensaje mucho más profesional
      throw new ForbiddenException(
        `Acceso restringido: Los usuarios con rol '${user.role}' no tienen permiso para acceder a este recurso.`,
      );
    }

    return hasRole;
  }
}
