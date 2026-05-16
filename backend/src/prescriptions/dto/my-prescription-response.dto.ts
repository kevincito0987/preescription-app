// 🟢 IMPORTAMOS LOS DECORADORES DE SWAGGER
import { ApiProperty } from '@nestjs/swagger';

export class DoctorResponseDto {
  @ApiProperty({
    description: 'ID único (UUIDv4) del perfil del doctor',
    example: 'b8f2c3d4-e2f4-4a6b-8c2d-4e2f4a6b8c2d',
  })
  id: string;

  @ApiProperty({
    description: 'Especialidad médica del profesional que emite la receta',
    example: 'Medicina General',
  })
  specialty: string;

  @ApiProperty({
    description: 'Nombre completo del médico',
    example: 'Dr. Alejandro Cárdenas',
  })
  fullName: string;

  @ApiProperty({
    description: 'Correo electrónico institucional del médico',
    example: 'a.cardenas@clinica.com',
  })
  email: string;
}

export class MyPrescriptionResponseDto {
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
    description: 'Estado actual de la receta desde la perspectiva del paciente',
    enum: ['pending', 'consumed', 'expired'],
    example: 'pending',
  })
  status: string;

  @ApiProperty({
    description:
      'Notas, recomendaciones o diagnóstico general adjunto a la receta',
    example: 'Tomar abundante líquido y guardar reposo.',
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({
    description: 'Fecha y hora en la que el médico emitió la prescripción',
    example: '2026-05-16T12:43:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha y hora de la última modificación en el sistema',
    example: '2026-05-16T13:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description:
      'Fecha y hora exacta en la que el paciente reclamó los medicamentos (null si está pendiente)',
    example: null,
    nullable: true,
  })
  consumedAt: Date | null;

  @ApiProperty({
    description:
      'Información detallada del médico encargado que formuló la receta',
    type: DoctorResponseDto, // 👈 Anidamos el DTO del doctor mapeado arriba
  })
  doctor: DoctorResponseDto;

  @ApiProperty({
    description:
      'Listado de los medicamentos específicos detallados dentro de esta receta',
    example: [
      {
        id: '99999999-8888-7777-6666-555555555555',
        name: 'Ibuprofeno',
        dosis: '400mg',
        cantidad: '10 tabletas',
        indicaciones: 'Cada 12 horas después de comer',
      },
    ],
  })
  items: any[];
}
