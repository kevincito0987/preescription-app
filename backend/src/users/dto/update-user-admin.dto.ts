import { IsOptional, IsString, IsEnum } from 'class-validator';

export class UpdateUserAdminDto {
  @IsOptional()
  @IsString()
  role?: string; // El admin puede cambiar roles

  @IsOptional()
  @IsString()
  status?: string; // Por ejemplo, para activar/desactivar cuenta
}
