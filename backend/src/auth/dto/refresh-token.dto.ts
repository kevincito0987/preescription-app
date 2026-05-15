import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @IsString({ message: 'El refresh token debe ser una cadena de texto válida' })
  @IsNotEmpty({
    message: 'El refresh token es obligatorio para renovar la sesión',
  })
  refreshToken: string;
}
