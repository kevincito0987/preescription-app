// src/prescriptions/prescriptions.controller.ts
// 🟢 CORRECCIÓN: Agregamos Param al import de '@nestjs/common'
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  Req,
  Res,
  Query,
  Param,
  Request,
} from '@nestjs/common';
import type { Response } from 'express'; // 👈 Nota el "type" aquíimport { PrescriptionsService } from './prescriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PrescriptionsService } from './prescriptions.service';
import { GetMyPrescriptionsFilterDto } from './dto/get-my-prescriptions-filter.dto';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';

@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  async getMyPrescriptions(
    @Req() req: any,
    @Query() filters: GetMyPrescriptionsFilterDto,
  ) {
    const userId = req.user.id;
    return this.prescriptionsService.findMyPrescriptions(userId, filters);
  }

  // 1. Ruta para el historial del Doctor
  @Get('doctor')
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  async getDoctorPrescriptions(
    @Req() req: any,
    @Query() filters: GetMyPrescriptionsFilterDto,
  ) {
    const userId = req.user.id;
    return this.prescriptionsService.findByDoctor(userId, filters);
  }

  // 2. Ruta para buscar por código médico único
  @Get('search/:medicalCode')
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  async getByMedicalCode(@Param('medicalCode') medicalCode: string) {
    // 🟢 Ya no marcará error aquí
    return this.prescriptionsService.findByMedicalCode(medicalCode);
  }

  // 1. Ruta para que el Admin vea TODO el universo de prescripciones (Paginado)
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  async getAllPrescriptionsForAdmin(
    @Query() filters: GetMyPrescriptionsFilterDto,
  ) {
    return this.prescriptionsService.findAllForAdmin(filters);
  }

  // 2. Ruta para que el Admin audite a un doctor específico pasando su ID por URL (Paginado)
  @Get('admin/doctor/:doctorDetailId')
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  async getDoctorPrescriptionsForAdmin(
    @Param('doctorDetailId') doctorDetailId: string,
    @Query() filters: GetMyPrescriptionsFilterDto,
  ) {
    return this.prescriptionsService.findByDoctorForAdmin(
      doctorDetailId,
      filters,
    );
  }

  // 3. Ruta para que el Admin busque una prescripción específica por su Código Médico
  @Get('admin/search/:medicalCode')
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  async getByMedicalCodeForAdmin(@Param('medicalCode') medicalCode: string) {
    return this.prescriptionsService.findByMedicalCodeForAdmin(medicalCode);
  }

  // 🟢 NUEVO ENDPOINT DE MÉTRICAS PARA EL DASHBOARD DEL ADMIN
  @Get('admin/metrics')
  @UseGuards(JwtAuthGuard) // Asegúrate de protegerlo con los guards correspondientes
  async getMetricsForAdmin() {
    return this.prescriptionsService.getAdminMetrics();
  }

  // 🟢 POST: Crear una nueva prescripción (Exclusivo Médicos)
  @Post()
  @UseGuards(JwtAuthGuard) // Protegido con JWT para extraer la identidad del médico
  async create(
    @Body() createPrescriptionDto: CreatePrescriptionDto,
    @Request() req,
  ) {
    // req.user.id contiene el userId almacenado en el Token JWT del médico
    const doctorUserId = req.user.id;
    return this.prescriptionsService.createPrescription(
      doctorUserId,
      createPrescriptionDto,
    );
  }

  // 🔵 PATCH: Cambiar estado a consumida (Exclusivo Pacientes)
  @Patch(':id/consume')
  @UseGuards(JwtAuthGuard) // Protegemos con token JWT
  async consume(
    @Param('id') id: string, // Captura la ID de la receta por parámetro de ruta
    @Request() req,
  ) {
    // req.user.id extrae el userId del token del paciente autenticado
    const patientUserId = req.user.id;
    return this.prescriptionsService.consumePrescription(id, patientUserId);
  }
  // 🔵 GET: Descargar reporte en formato PDF
  @Get(':id/pdf')
  @UseGuards(JwtAuthGuard)
  async downloadPdf(
    @Param('id') id: string,
    @Res() res: Response, // Mantenemos el @Res para tomar el control
  ) {
    // 🟢 CORREGIDO: Le quitamos el ', res' al método. Solo le pasamos el 'id'
    const pdfBuffer =
      await this.prescriptionsService.generatePrescriptionPdf(id);

    // Configuramos los headers para la descarga del archivo binario
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=prescripcion-${id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    // Enviamos el buffer final al cliente
    res.end(pdfBuffer);
  }
}
