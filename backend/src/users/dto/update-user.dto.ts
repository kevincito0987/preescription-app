import {
  IsOptional,
  IsString,
  IsEmail,
  MinLength,
  IsEnum,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  // Solo el admin debería poder tocar esto, lo controlaremos en el controller
  @IsOptional()
  @IsString()
  role?: string;
}
