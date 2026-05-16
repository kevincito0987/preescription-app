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
import type { Response } from 'express';
import { PrescriptionsService } from './prescriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GetMyPrescriptionsFilterDto } from './dto/get-my-prescriptions-filter.dto';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';

// 🟢 NUEVOS IMPORTS DE SWAGGER
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Prescriptions (Gestión de Recetas Médicas)') // 🏷️ Agrupa todas las recetas en su propia sección principal
@ApiBearerAuth('JWT-auth') // 🔒 Candado global: Todas las rutas de este controlador requieren autenticación
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @ApiOperation({
    summary: 'Historial de recetas del Paciente',
    description:
      'Recupera el listado completo de prescripciones médicas asignadas al paciente autenticado. Soporta paginación y filtros por estado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de recetas recuperado con éxito.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado (Falta token o es inválido).',
  })
  @ApiResponse({
    status: 429,
    description:
      'Demasiadas peticiones. Bloqueado temporalmente por límite de tasa.',
  })
  async getMyPrescriptions(
    @Req() req: any,
    @Query() filters: GetMyPrescriptionsFilterDto,
  ) {
    const userId = req.user.id;
    return this.prescriptionsService.findMyPrescriptions(userId, filters);
  }

  @Get('doctor')
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @ApiOperation({
    summary: 'Historial de recetas emitidas por el Doctor',
    description:
      'Permite al médico autenticado revisar el registro histórico de todas las recetas que ha emitido a sus pacientes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de recetas devuelto con éxito.',
  })
  async getDoctorPrescriptions(
    @Req() req: any,
    @Query() filters: GetMyPrescriptionsFilterDto,
  ) {
    const userId = req.user.id;
    return this.prescriptionsService.findByDoctor(userId, filters);
  }

  @Get('search/:medicalCode')
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @ApiOperation({
    summary: 'Buscar receta por su código único',
    description:
      'Permite buscar una prescripción específica utilizando su código médico único global.',
  })
  @ApiParam({
    name: 'medicalCode',
    description: 'Código único de la prescripción (Ej: MED-837482)',
  })
  @ApiResponse({ status: 200, description: 'Prescripción encontrada.' })
  @ApiResponse({
    status: 404,
    description: 'No se encontró ninguna prescripción con ese código.',
  })
  async getByMedicalCode(@Param('medicalCode') medicalCode: string) {
    return this.prescriptionsService.findByMedicalCode(medicalCode);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @ApiOperation({
    summary: 'Admin: Listado maestro global de recetas',
    description:
      'Acceso total para que el Administrador vea, audite y filtre absolutamente todas las recetas emitidas en la plataforma.',
  })
  @ApiResponse({
    status: 200,
    description: 'Universo global de recetas devuelto con éxito.',
  })
  async getAllPrescriptionsForAdmin(
    @Query() filters: GetMyPrescriptionsFilterDto,
  ) {
    return this.prescriptionsService.findAllForAdmin(filters);
  }

  @Get('admin/doctor/:doctorDetailId')
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @ApiOperation({
    summary: 'Admin: Auditar recetas de un Doctor específico',
    description:
      'Permite al Administrador filtrar el historial de prescripciones emitidas por un médico en particular pasando su ID por parámetro.',
  })
  @ApiParam({
    name: 'doctorDetailId',
    description: 'ID del perfil o detalle del doctor a auditar',
  })
  async getDoctorPrescriptionsForAdmin(
    @Param('doctorDetailId') doctorDetailId: string,
    @Query() filters: GetMyPrescriptionsFilterDto,
  ) {
    return this.prescriptionsService.findByDoctorForAdmin(
      doctorDetailId,
      filters,
    );
  }

  @Get('admin/search/:medicalCode')
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @ApiOperation({ summary: 'Admin: Buscar receta por código' })
  @ApiParam({
    name: 'medicalCode',
    description: 'Código único alfa-numérico de la prescripción',
  })
  async getByMedicalCodeForAdmin(@Param('medicalCode') medicalCode: string) {
    return this.prescriptionsService.findByMedicalCodeForAdmin(medicalCode);
  }

  @Get('admin/metrics')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Admin: Métricas generales para el Dashboard',
    description:
      'Retorna contadores estadísticos globales del sistema (recetas emitidas, consumidas, médicos activos, etc.) para renderizar gráficos en el frontend.',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas calculadas y devueltas correctamente.',
  })
  async getMetricsForAdmin() {
    return this.prescriptionsService.getAdminMetrics();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Emitir una nueva prescripción (Exclusivo Médicos)',
    description:
      'Crea una receta en el sistema. Extrae automáticamente el ID del médico desde el token JWT.',
  })
  @ApiResponse({
    status: 201,
    description: 'Prescripción creada y almacenada exitosamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Cuerpo de la petición inválido o campos obligatorios vacíos.',
  })
  async create(
    @Body() createPrescriptionDto: CreatePrescriptionDto,
    @Request() req,
  ) {
    const doctorUserId = req.user.id;
    return this.prescriptionsService.createPrescription(
      doctorUserId,
      createPrescriptionDto,
    );
  }

  @Patch(':id/consume')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Marcar receta como Consumida (Exclusivo Pacientes)',
    description:
      'Cambia el estado de una prescripción a consumida al momento de reclamar los medicamentos.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único (UUID) de la prescripción a actualizar',
  })
  @ApiResponse({
    status: 200,
    description: 'Receta actualizada como consumida.',
  })
  async consume(@Param('id') id: string, @Request() req) {
    const patientUserId = req.user.id;
    return this.prescriptionsService.consumePrescription(id, patientUserId);
  }

  @Get(':id/pdf')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Descargar receta en formato PDF',
    description:
      'Genera bajo demanda un documento PDF limpio y formateado listo para impresión usando Puppeteer en el servidor.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la prescripción de la cual se requiere generar el PDF',
  })
  @ApiResponse({
    status: 200,
    description:
      'Retorna el stream binario de la aplicación/pdf directamente para descarga.',
  })
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer =
      await this.prescriptionsService.generatePrescriptionPdf(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=prescripcion-${id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
