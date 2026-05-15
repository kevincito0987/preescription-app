import {
  IsString,
  IsOptional,
  IsInt,
  IsNotEmpty,
  Min,
  IsUUID,
} from 'class-validator';

export class CreatePrescriptionItemDto {
  //@IsUUID('4', { message: 'El ID de la prescripción debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID de la prescripción es obligatorio' })
  prescriptionId: string;

  @IsString({ message: 'El nombre del medicamento debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del medicamento es obligatorio' })
  name: string;

  @IsString({ message: 'La dosis debe ser texto' })
  @IsOptional()
  dosage?: string;

  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @IsOptional()
  @Min(1, { message: 'La cantidad mínima es 1' })
  quantity?: number;

  @IsString({ message: 'Las instrucciones deben ser texto' })
  @IsNotEmpty({ message: 'Las instrucciones son obligatorias' })
  instructions: string;
}
