// 🟢 IMPORTAMOS LOS DECORADORES DE SWAGGER
import { ApiProperty } from '@nestjs/swagger';

export class PatientResponseDto {
  @ApiProperty({
    description: 'ID único (UUIDv4) del paciente',
    example: 'd3b07384-d113-4956-a5d2-cc574542f9d2',
  })
  id: string;

  @ApiProperty({
    description:
      'Fecha de nacimiento del paciente (puede ser null si no está registrada)',
    example: '1995-08-25T00:00:00.000Z',
    nullable: true,
  })
  birthDate: Date | null;

  @ApiProperty({
    description: 'Nombre completo del paciente',
    example: 'Juan Carlos Pérez',
  })
  fullName: string;

  @ApiProperty({
    description: 'Correo electrónico de contacto del paciente',
    example: 'juan.perez@correo.com',
  })
  email: string;
}

export class DoctorPrescriptionResponseDto {
  @ApiProperty({
    description: 'ID único (UUIDv4) de la prescripción médica',
    example: 'e4f8c2d4-e2f4-4a6b-8c2d-4e2f4a6b8c2d',
  })
  id: string;

  @ApiProperty({
    description: 'Código médico único global generado para la receta',
    example: 'MED-837482',
  })
  medicalCode: string;

  @ApiProperty({
    description: 'Estado actual de la receta',
    enum: ['PENDING', 'CONSUMED', 'EXPIRED'],
    example: 'PENDING',
  })
  status: string;

  @ApiProperty({
    description: 'Notas o indicaciones generales dadas por el médico',
    example: 'Tomar los medicamentos después de las comidas.',
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({
    description: 'Fecha y hora de creación del registro',
    example: '2026-05-16T12:43:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha y hora de la última actualización del registro',
    example: '2026-05-16T13:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description:
      'Fecha y hora exacta en la que el paciente consumió/reclamó la receta',
    example: '2026-05-16T15:22:10.000Z',
    nullable: true,
  })
  consumedAt: Date | null;

  @ApiProperty({
    description: 'Información detallada del paciente asociado a la receta',
    type: PatientResponseDto,
  })
  patient: PatientResponseDto;

  @ApiProperty({
    description: 'Listado de medicamentos individuales incluidos en la receta',
    example: [
      {
        id: '11111111-2222-3333-4444-555555555555',
        name: 'Amoxicilina',
        dosis: '500mg',
        cantidad: '20 tabletas',
        indicaciones: 'Tomar 1 cápsula cada 8 horas',
      },
    ],
  }) // 👈 🟢 CORREGIDO AQUÍ (Cierre de llave y paréntesis correcto)
  items: any[];
}
