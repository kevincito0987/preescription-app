import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePrescriptionItemDto {
  @IsNotEmpty()
  @IsString()
  name: string; // Nombre del medicamento

  @IsNotEmpty()
  @IsString()
  dosis: string; // Dosis (ej: "500mg")

  @IsNotEmpty()
  @IsString()
  cantidad: string; // Cantidad (ej: "10 tabletas")

  @IsNotEmpty()
  @IsString()
  indicaciones: string; // Indicaciones (ej: "Tomar cada 8 horas")
}
