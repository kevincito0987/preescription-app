// src/prescriptions/dto/doctor-prescription-response.dto.ts

export class PatientResponseDto {
  id: string;
  birthDate: Date | null;
  fullName: string;
  email: string;
}

export class DoctorPrescriptionResponseDto {
  id: string;
  medicalCode: string;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  consumedAt: Date | null;
  patient: PatientResponseDto;
  items: any[];
}
