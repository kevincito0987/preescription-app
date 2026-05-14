import {
  Injectable,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: any) {
    return this.usersService.create(registerDto);
  }

  async login(loginDto: LoginDto) {
    // Con 'private readonly', this.usersService ya no es undefined
    const user = await this.usersService.findOneByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: String(user.role), // Convertimos el Enum a string para evitar el error de la imagen
    };

    // ... dentro de login o refresh
    return {
      accessToken: this.jwtService.sign(payload, {
        expiresIn: '1h', // Ponlo como string directo para probar
      }),
      refreshToken: this.jwtService.sign(payload, {
        expiresIn: '7d',
      }),
    };
  }

  async refresh(refreshTokenDto: RefreshTokenDto) {
    try {
      // 1. Validamos el token con una aserción de tipo para el secreto
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET') as string,
      });

      const user = await this.usersService.findOne(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      // 2. Preparamos el payload asegurando que el role sea un string plano
      const newPayload = {
        sub: user.id,
        email: user.email,
        role: String(user.role),
      };

      // 3. Firmamos los nuevos tokens usando 'as any' para los tiempos de expiración
      // Esto evita el error de "No overload matches this call"
      return {
        accessToken: this.jwtService.sign(newPayload, {
          expiresIn: (this.configService.get<string>('JWT_ACCESS_TTL') ||
            '1h') as any,
        }),
        refreshToken: this.jwtService.sign(newPayload, {
          expiresIn: (this.configService.get<string>('JWT_REFRESH_TTL') ||
            '7d') as any,
        }),
      };
    } catch (error) {
      // Si entra aquí, es porque verify falló o el usuario no existe
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }
}
