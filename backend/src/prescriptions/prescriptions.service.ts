// src/prescriptions/prescriptions.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MyPrescriptionResponseDto } from './dto/my-prescription-response.dto';
import { GetMyPrescriptionsFilterDto } from './dto/get-my-prescriptions-filter.dto';
import { DoctorPrescriptionResponseDto } from './dto/doctor-prescription-response.dto';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { Prisma } from '@prisma/client';
import * as puppeteer from 'puppeteer'; // 🟢 Importamos Puppeteer directo
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
  // 🟢 ACTUALIZAR ESTADO A CONSUMIDA (ROL: PACIENTE)
  async consumePrescription(
    prescriptionId: string,
    patientUserId: string,
  ): Promise<any> {
    // 1. Verificar que el usuario que ejecuta la acción sea un Paciente registrado
    const patient = await this.prisma.patient.findUnique({
      where: { userId: patientUserId },
    });

    if (!patient) {
      throw new ForbiddenException(
        'Acceso denegado. Este endpoint es exclusivo para uso de Pacientes.',
      );
    }

    // 2. Buscar la prescripción existente
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
    });

    if (!prescription) {
      throw new NotFoundException(
        `No se encontró ninguna prescripción médica con el ID: ${prescriptionId}`,
      );
    }

    // 3. Regla de seguridad: El paciente solo puede modificar SUS propias prescripciones
    if (prescription.patientId !== patient.id) {
      throw new ForbiddenException(
        'No tienes permisos para modificar el estado de esta prescripción médica.',
      );
    }

    // 4. Regla de negocio: Si ya está consumida, no es necesario procesarla de nuevo
    if (prescription.status === 'consumed') {
      throw new BadRequestException(
        'Esta prescripción ya ha sido marcada como consumida anteriormente.',
      );
    }

    // 5. Actualizar el estado y estampar la fecha de consumo en la BD
    const updatedPrescription = await this.prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        status: 'consumed', // Cambio de estado reglamentario
        consumedAt: new Date(), // Seteamos la fecha actual en el campo de tu DB
      },
    });

    return {
      message: 'Prescripción médica marcada como consumida con éxito.',
      data: {
        id: updatedPrescription.id,
        medicalCode: updatedPrescription.medicalCode,
        status: updatedPrescription.status,
        consumedAt: updatedPrescription.consumedAt,
      },
    };
  }

  async generatePrescriptionPdf(prescriptionId: string): Promise<Buffer> {
    // 1. Buscar la receta con todas sus relaciones (con el 'as any' para evitar líos de tipos)
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        items: true,
        patient: { include: { user: true } },
        author: { include: { user: true } },
      },
    });

    if (!prescription) {
      throw new NotFoundException(
        `No se encontró la prescripción médica con ID: ${prescriptionId}`,
      );
    }

    const data: any = prescription;

    // 2. Formatear fechas
    const createdAtFormated = new Date(data.createdAt).toLocaleDateString(
      'es-CO',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
    );

    const consumedAtFormated = data.consumedAt
      ? new Date(data.consumedAt).toLocaleDateString('es-CO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'N/A';

    // 3. Generar las filas de la tabla de medicamentos
    const tableRows = data.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #2d3748;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #4a5568;">${item.dosage || 'No especificada'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #4a5568;">${item.quantity || 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #4a5568; font-size: 13px;">${item.instructions}</td>
        </tr>
      `,
      )
      .join('');

    // 4. Plantilla HTML (Tu diseño clínico limpio)
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 40px; color: #333; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #3182ce; padding-bottom: 20px; margin-bottom: 30px; }
          .logo-area { font-size: 24px; font-weight: bold; color: #2b6cb0; text-transform: uppercase; letter-spacing: 1px; }
          .doc-info { text-align: right; font-size: 14px; color: #4a5568; }
          .title { text-align: center; font-size: 22px; color: #2d3748; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 0.5px; }
          .meta-grid { display: table; width: 100%; margin-bottom: 30px; border-collapse: collapse; }
          .meta-col { display: table-cell; width: 50%; vertical-align: top; background: #f7fafc; padding: 15px; border: 1px solid #e2e8f0; border-radius: 4px; }
          .meta-title { font-size: 12px; color: #718096; text-transform: uppercase; font-weight: bold; margin-bottom: 5px; }
          .meta-value { font-size: 14px; color: #2d3748; margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #ebf8ff; color: #2b6cb0; text-transform: uppercase; font-size: 12px; padding: 12px 10px; text-align: left; border-bottom: 2px solid #bee3f8; }
          .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          .badge { display: inline-block; padding: 3px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; text-transform: uppercase; }
          .pending { background-color: #feebc8; color: #c05621; }
          .consumed { background-color: #c6f6d5; color: #22543d; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-area">➕ Sistema Médico</div>
          <div class="doc-info">
            <strong>Dr. ${data.author.user.fullName}</strong><br>
            Especialidad: ${data.author.specialty || 'Médico General'}<br>
            Contacto: ${data.author.user.email}
          </div>
        </div>

        <div class="title">Prescripción Médica Oficial</div>

        <div class="meta-grid">
          <div class="meta-col" style="border-right: none;">
            <div class="meta-title">Datos del Paciente</div>
            <div class="meta-value"><strong>Nombre:</strong> ${data.patient.user.fullName}</div>
            <div class="meta-value"><strong>Email:</strong> ${data.patient.user.email}</div>
          </div>
          <div class="meta-col">
            <div class="meta-title">Detalles de la Receta</div>
            <div class="meta-value"><strong>Código:</strong> ${data.medicalCode}</div>
            <div class="meta-value"><strong>Fecha Emisión:</strong> ${createdAtFormated}</div>
            <div class="meta-value">
              <strong>Estado:</strong> 
              <span class="badge ${data.status}">${data.status === 'pending' ? 'Pendiente' : 'Consumida'}</span>
            </div>
            ${data.status === 'consumed' ? `<div class="meta-value"><strong>Consumido el:</strong> ${consumedAtFormated}</div>` : ''}
          </div>
        </div>

        ${data.notes ? `<div style="background: #fffaf0; border-left: 4px solid #dd6b20; padding: 15px; margin-bottom: 30px; font-size: 14px; color: #744210;"><strong>Notas Médicas:</strong> ${data.notes}</div>` : ''}

        <div class="meta-title" style="margin-bottom: 10px;">Medicamentos Recetados</div>
        <table>
          <thead>
            <tr>
              <th style="width: 25%;">Medicamento</th>
              <th style="width: 15%;">Dosificación</th>
              <th style="width: 10%; text-align: center;">Cant.</th>
              <th style="width: 50%;">Indicaciones</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="footer">
          Documento generado de forma digital por el Sistema de Prescripciones Médicas.<br>
          Código de verificación único: ${data.id}
        </div>
      </body>
      </html>
    `;

    // 5. 🟢 LANZAMIENTO CONFIGURADO PARA ENTORNO LINUX/DEVCONTAINER
    const browser = await puppeteer.launch({
      headless: true,
      // 🚀 LE DECIMOS A PUPPETEER QUE USE EL CHROME QUE ACABAMOS DE INSTALAR EN EL CONTENEDOR
      executablePath: '/usr/bin/google-chrome-stable',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Añadimos esto para evitar problemas de memoria en contenedores
      ],
    });

    const page = await browser.newPage();

    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

    const pdfUint8Array = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
    });

    await browser.close();

    return Buffer.from(pdfUint8Array);
  }
}
