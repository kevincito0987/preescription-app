// src/prescriptions/dto/my-prescription-response.dto.ts

export class DoctorResponseDto {
  id: string;
  specialty: string;
  fullName: string;
  email: string;
}

export class MyPrescriptionResponseDto {
  id: string;
  medicalCode: string;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  consumedAt: Date | null;
  doctor: DoctorResponseDto;
  items: any[]; // Aquí puedes mapear tu DTO de items si ya lo tienes
}
