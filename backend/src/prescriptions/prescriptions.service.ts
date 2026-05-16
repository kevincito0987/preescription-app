// src/prescriptions/prescriptions.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MyPrescriptionResponseDto } from './dto/my-prescription-response.dto';
import { GetMyPrescriptionsFilterDto } from './dto/get-my-prescriptions-filter.dto';
import { DoctorPrescriptionResponseDto } from './dto/doctor-prescription-response.dto';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { Prisma } from '@prisma/client';

// Argumentos e Inclusión relacional para las consultas de Pacientes
const prescriptionWithDoctorArgs =
  Prisma.validator<Prisma.PrescriptionFindManyArgs>()({
    include: {
      items: true,
      author: {
        include: {
          user: true,
        },
      },
    },
  });

type PrescriptionWithDoctor = Prisma.PrescriptionGetPayload<
  typeof prescriptionWithDoctorArgs
>;

// Argumentos e Inclusión relacional para las consultas de Doctores
const prescriptionWithPatientArgs =
  Prisma.validator<Prisma.PrescriptionFindManyArgs>()({
    include: {
      items: true,
      patient: {
        include: {
          user: true,
        },
      },
    },
  });

// 🟢 CORRECCIÓN: Quitamos el duplicado Prisma.Prisma. Ahora compilará limpio
type PrescriptionWithPatient = Prisma.PrescriptionGetPayload<
  typeof prescriptionWithPatientArgs
>;

// Interfaz para la respuesta paginada del Paciente
export interface PaginatedPrescriptions {
  data: MyPrescriptionResponseDto[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
  };
}

// 🟢 NUEVA INTERFAZ: Para la respuesta paginada del Doctor (evita choques de DTOs en TS)
export interface PaginatedDoctorPrescriptions {
  data: DoctorPrescriptionResponseDto[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
  };
}

@Injectable()
export class PrescriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. GETTER: Historial para el Paciente Logueado
  async findMyPrescriptions(
    userId: string,
    filters: GetMyPrescriptionsFilterDto,
  ): Promise<PaginatedPrescriptions> {
    const { page = 1, limit = 10 } = filters;
    const skip = (Number(page) - 1) * Number(limit);

    const [prescriptions, total] = await Promise.all([
      this.prisma.prescription.findMany({
        where: { patient: { userId } },
        skip,
        take: Number(limit),
        include: prescriptionWithDoctorArgs.include,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.prescription.count({
        where: { patient: { userId } },
      }),
    ]);

    const mappedData: MyPrescriptionResponseDto[] = (
      prescriptions as PrescriptionWithDoctor[]
    ).map((p): MyPrescriptionResponseDto => {
      const doctorData = p.author as any;
      return {
        id: String(p.id),
        medicalCode: p.medicalCode,
        status: p.status,
        notes: p.notes,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        consumedAt: p.consumedAt,
        items: p.items,
        doctor: {
          id: String(doctorData.id),
          specialty: doctorData.specialty || 'No especificada',
          fullName: doctorData.user?.fullName || 'Sin nombre',
          email: doctorData.user?.email || 'Sin email',
        },
      };
    });

    return {
      data: mappedData,
      meta: {
        total,
        page: Number(page),
        lastPage: Math.ceil(total / Number(limit)),
      },
    };
  }

  // 2. GETTER: Historial de prescripciones creadas por el Doctor (Paginado)
  // 🟢 CORRECCIÓN: Retorna Promise<PaginatedDoctorPrescriptions> para aceptar la propiedad 'patient'
  async findByDoctor(
    userId: string,
    filters: GetMyPrescriptionsFilterDto,
  ): Promise<PaginatedDoctorPrescriptions> {
    const { page = 1, limit = 10 } = filters;
    const skip = (Number(page) - 1) * Number(limit);

    const [prescriptions, total] = await Promise.all([
      this.prisma.prescription.findMany({
        where: { author: { userId } },
        skip,
        take: Number(limit),
        include: prescriptionWithPatientArgs.include,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.prescription.count({
        where: { author: { userId } },
      }),
    ]);

    // Mapeamos el arreglo usando la estructura exacta del DoctorPrescriptionResponseDto
    const mappedData: DoctorPrescriptionResponseDto[] = (
      prescriptions as PrescriptionWithPatient[]
    ).map((p): DoctorPrescriptionResponseDto => {
      const patientData = p.patient as any;
      return {
        id: String(p.id),
        medicalCode: p.medicalCode,
        status: p.status,
        notes: p.notes,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        consumedAt: p.consumedAt,
        items: p.items,
        patient: {
          id: String(patientData.id),
          birthDate: patientData.birthDate,
          fullName: patientData.user?.fullName || 'Sin nombre',
          email: patientData.user?.email || 'Sin email',
        },
      };
    });

    return {
      data: mappedData,
      meta: {
        total,
        page: Number(page),
        lastPage: Math.ceil(total / Number(limit)),
      },
    };
  }

  // 3. GETTER: Buscar una prescripción específica por su Código Médico
  async findByMedicalCode(medicalCode: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { medicalCode },
      include: {
        items: true,
        patient: { include: { user: true } },
        author: { include: { user: true } },
      },
    });

    if (!prescription) {
      throw new NotFoundException(
        `La prescripción con código ${medicalCode} no fue encontrada`,
      );
    }

    const rawPrescription = prescription as any;
    const patientData = rawPrescription.patient;
    const doctorData = rawPrescription.author;

    return {
      id: String(rawPrescription.id),
      medicalCode: rawPrescription.medicalCode,
      status: rawPrescription.status,
      notes: rawPrescription.notes,
      createdAt: rawPrescription.createdAt,
      updatedAt: rawPrescription.updatedAt,
      consumedAt: rawPrescription.consumedAt,
      items: rawPrescription.items,
      patient: {
        id: String(patientData?.id),
        fullName: patientData?.user?.fullName || 'Sin nombre',
        email: patientData?.user?.email || 'Sin email',
      },
      doctor: {
        id: String(doctorData?.id),
        specialty: doctorData?.specialty || 'No especificada',
        fullName: doctorData?.user?.fullName || 'Sin nombre',
      },
    };
  }

  // 1. GETTER ADMIN: Trae TODAS las prescripciones de la plataforma (Paginado)
  async findAllForAdmin(filters: GetMyPrescriptionsFilterDto): Promise<any> {
    const {
      page = 1,
      limit = 10,
      doctorName,
      status,
      startDate,
      endDate,
    } = filters;
    const skip = (Number(page) - 1) * Number(limit);

    const whereCondition: Prisma.PrescriptionWhereInput = {};

    // Filtro por nombre de doctor
    if (doctorName) {
      whereCondition.author = {
        user: { fullName: { contains: doctorName, mode: 'insensitive' } },
      };
    }

    // 🟢 Filtro por Estado (pending | consumed)
    if (status) {
      whereCondition.status = status as any;
    }

    // 🟢 Filtro por Rango de Fechas (Por día)
    if (startDate || endDate) {
      whereCondition.createdAt = {};
      if (startDate) {
        // Setea al inicio del día 00:00:00
        whereCondition.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        // Setea al final del día 23:59:59
        whereCondition.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`);
      }
    }

    const [prescriptions, total] = await Promise.all([
      this.prisma.prescription.findMany({
        where: whereCondition,
        skip,
        take: Number(limit),
        include: {
          items: true,
          patient: { include: { user: true } },
          author: { include: { user: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.prescription.count({ where: whereCondition }),
    ]);

    const mappedData = prescriptions.map((p) => {
      const patientData = p.patient as any;
      const doctorData = p.author as any;

      return {
        id: String(p.id),
        medicalCode: p.medicalCode,
        status: p.status,
        notes: p.notes,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        consumedAt: p.consumedAt,
        items: p.items,
        patient: {
          id: String(patientData?.id),
          fullName: patientData?.user?.fullName || 'Sin nombre',
          email: patientData?.user?.email || 'Sin email',
        },
        doctor: {
          id: String(doctorData?.id),
          specialty: doctorData?.specialty || 'No especificada',
          fullName: doctorData?.user?.fullName || 'Sin nombre',
          email: doctorData?.user?.email || 'Sin email',
        },
      };
    });

    return {
      data: mappedData,
      meta: {
        total,
        page: Number(page),
        lastPage: Math.ceil(total / Number(limit)),
      },
    };
  }

  // 2. GETTER ADMIN: Buscar las prescripciones de un doctor específico por su ID de autor
  async findByDoctorForAdmin(
    doctorAuthorId: string,
    filters: GetMyPrescriptionsFilterDto,
  ): Promise<any> {
    const { page = 1, limit = 10 } = filters;
    const skip = (Number(page) - 1) * Number(limit);

    const [prescriptions, total] = await Promise.all([
      this.prisma.prescription.findMany({
        where: { authorId: doctorAuthorId },
        skip,
        take: Number(limit),
        include: {
          items: true,
          patient: { include: { user: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.prescription.count({
        where: { authorId: doctorAuthorId },
      }),
    ]);

    const mappedData = prescriptions.map((p) => {
      const patientData = p.patient as any;
      return {
        id: String(p.id),
        medicalCode: p.medicalCode,
        status: p.status,
        notes: p.notes,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        consumedAt: p.consumedAt,
        items: p.items,
        patient: {
          id: String(patientData?.id),
          fullName: patientData?.user?.fullName || 'Sin nombre',
          email: patientData?.user?.email || 'Sin email',
        },
      };
    });

    return {
      data: mappedData,
      meta: {
        total,
        page: Number(page),
        lastPage: Math.ceil(total / Number(limit)),
      },
    };
  }

  // 3. GETTER ADMIN: Buscar CUALQUIER prescripción por código médico con data cruzada completa
  async findByMedicalCodeForAdmin(medicalCode: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { medicalCode },
      include: {
        items: true,
        patient: { include: { user: true } },
        author: { include: { user: true } },
      },
    });

    if (!prescription) {
      throw new NotFoundException(
        `La prescripción con código ${medicalCode} no fue encontrada en el sistema`,
      );
    }

    const rawPrescription = prescription as any;
    const patientData = rawPrescription.patient;
    const doctorData = rawPrescription.author;

    return {
      id: String(rawPrescription.id),
      medicalCode: rawPrescription.medicalCode,
      status: rawPrescription.status,
      notes: rawPrescription.notes,
      createdAt: rawPrescription.createdAt,
      updatedAt: rawPrescription.updatedAt,
      consumedAt: rawPrescription.consumedAt,
      items: rawPrescription.items,
      patient: {
        id: String(patientData?.id),
        fullName: patientData?.user?.fullName || 'Sin nombre',
        email: patientData?.user?.email || 'Sin email',
      },
      doctor: {
        id: String(doctorData?.id),
        specialty: doctorData?.specialty || 'No especificada',
        fullName: doctorData?.user?.fullName || 'Sin nombre',
        email: doctorData?.user?.email || 'Sin email',
      },
    };
  }

  async getAdminMetrics(): Promise<any> {
    // Ejecutamos consultas paralelas para optimizar tiempos de respuesta
    const [
      totalPatients,
      totalDoctors,
      totalPrescriptions,
      pendingPrescriptions,
      consumedPrescriptions,
      allPrescriptionsForDates,
    ] = await Promise.all([
      this.prisma.patient.count(), // # de pacientes
      this.prisma.doctor.count(), // # de médicos
      this.prisma.prescription.count(), // Total recetas
      this.prisma.prescription.count({ where: { status: 'pending' } }), // por estado
      this.prisma.prescription.count({ where: { status: 'consumed' } }), // por estado
      // Traemos las fechas para agruparlas por día en memoria de forma limpia
      this.prisma.prescription.findMany({
        select: { createdAt: true },
      }),
    ]);

    // Agrupar prescripciones por día (YYYY-MM-DD)
    const prescriptionsByDay: Record<string, number> = {};
    allPrescriptionsForDates.forEach((p) => {
      const day = p.createdAt.toISOString().split('T')[0]; // Extrae solo '2026-05-15'
      prescriptionsByDay[day] = (prescriptionsByDay[day] || 0) + 1;
    });

    // Convertimos el mapa en un arreglo ordenado para el frontend
    const formattedPrescriptionsByDay = Object.entries(prescriptionsByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => b.date.localeCompare(a.date)); // De más reciente a más antigua

    return {
      summary: {
        totalPatients,
        totalDoctors,
        totalPrescriptions,
      },
      byStatus: {
        pending: pendingPrescriptions,
        consumed: consumedPrescriptions,
      },
      byDay: formattedPrescriptionsByDay, // prescripciones por día
    };
  }

  // 🚀 CREAR PRESCRIPCIÓN (ROL: MÉDICO)
  async createPrescription(
    doctorUserId: string,
    dto: CreatePrescriptionDto,
  ): Promise<any> {
    const { patientEmail, notes, items } = dto;

    // 1. Verificar que el autor exista y sea un Médico registrado
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId: doctorUserId },
    });

    if (!doctor) {
      throw new BadRequestException(
        'El usuario autenticado no está registrado como Médico en la plataforma.',
      );
    }

    // 2. Buscar al paciente por el Email de su cuenta de usuario
    const patientUser = await this.prisma.user.findUnique({
      where: { email: patientEmail },
      include: { patient: true },
    });

    if (!patientUser || !patientUser.patient) {
      throw new NotFoundException(
        `No se encontró ningún paciente registrado con el email: ${patientEmail}`,
      );
    }

    // 3. Generar un código médico único (puedes usar la lógica que prefieras, ej: RX- + timestamp o random)
    const medicalCode = `RX-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;

    // 4. Crear la prescripción con sus ítems de forma atómica en la BD
    const newPrescription = await this.prisma.prescription.create({
      data: {
        medicalCode,
        status: 'pending', // Inicia por defecto en pendiente
        notes: notes || '',
        patientId: patientUser.patient.id,
        authorId: doctor.id,
        items: {
          create: items.map((item) => ({
            name: item.name,
            dosage: item.dosis, // 🟢 Corregido: Mapeamos 'dosis' al campo 'dosage' de la BD
            quantity: item.cantidad ? Number(item.cantidad) : null, // 🟢 Corregido: Convertimos el string a número entero (Int)
            instructions: item.indicaciones, // Mapeado correctamente
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // 5. Retornar la respuesta estructurada limpia
    return {
      message: 'Prescripción médica creada con éxito',
      data: {
        id: String(newPrescription.id),
        medicalCode: newPrescription.medicalCode,
        status: newPrescription.status,
        notes: newPrescription.notes,
        createdAt: newPrescription.createdAt,
        items: newPrescription.items,
        patient: {
          id: String(patientUser.patient.id),
          fullName: patientUser.fullName,
          email: patientUser.email,
        },
      },
    };
  }
}
