import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PrescriptionItemsService } from './prescription-items.service';
import { GetPrescriptionItemFilterDto } from './dto/get-prescription-item-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreatePrescriptionItemDto } from './dto/create-prescription-item.dto';
import { UpdatePrescriptionItemDto } from './dto/update-prescription-item.dto';

// 🟢 NUEVOS IMPORTS DE SWAGGER
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Prescription Items (Catálogo de Medicamentos)') // 🏷️ Agrupa estos endpoints bajo una sección clara en la UI
@ApiBearerAuth('JWT-auth') // 🔒 Candado global para todos los endpoints del controlador
@Controller('prescription-items')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrescriptionItemsController {
  constructor(private readonly itemsService: PrescriptionItemsService) {}

  @Get()
  @Roles('admin', 'doctor')
  @ApiOperation({
    summary: 'Listar catálogo de ítems/medicamentos',
    description:
      'Permite a los Administradores y Doctores visualizar y filtrar los medicamentos registrados en el sistema.',
  })
  @ApiResponse({
    status: 200,
    description: 'Catálogo de medicamentos recuperado con éxito.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado por falta de token JWT.',
  })
  @ApiResponse({
    status: 403,
    description: 'Permisos insuficientes (Exclusivo Admin/Doctor).',
  })
  findAll(@Query() filters: GetPrescriptionItemFilterDto) {
    return this.itemsService.findAll(filters);
  }

  @Get(':id')
  @Roles('admin', 'doctor')
  @ApiOperation({ summary: 'Obtener un ítem específico por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID único (UUID o numérico) del medicamento a buscar',
  })
  @ApiResponse({
    status: 200,
    description: 'Medicamento encontrado con éxito.',
  })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes.' })
  @ApiResponse({
    status: 404,
    description: 'El ítem solicitado no existe en el sistema.',
  })
  findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  @Post()
  @Roles('admin') // SOLO EL ADMIN PUEDE CREAR ITEMS SEGÚN TU REQUERIMIENTO
  @ApiOperation({
    summary: 'Registrar un nuevo medicamento (Solo Admin)',
    description:
      'Añade un nuevo ítem o medicamento al catálogo maestro global del sistema.',
  })
  @ApiResponse({
    status: 201,
    description: 'Medicamento creado y registrado con éxito.',
  })
  @ApiResponse({
    status: 400,
    description: 'Estructura del cuerpo (JSON) inválida o con faltantes.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Operación rechazada. Solo permitida para usuarios con rol admin.',
  })
  async create(@Body() createDto: CreatePrescriptionItemDto) {
    return this.itemsService.create(createDto);
  }

  @Patch(':identifier')
  @Roles('admin')
  @ApiOperation({
    summary: 'Actualizar un medicamento por ID o Nombre (Solo Admin)',
    description:
      'Modifica las propiedades de un ítem existente. El servicio resolverá dinámicamente si el parámetro enviado corresponde al ID único o al Nombre del medicamento.',
  })
  @ApiParam({
    name: 'identifier',
    description: 'ID único o Nombre exacto del medicamento a modificar',
  })
  @ApiResponse({
    status: 200,
    description: 'Medicamento actualizado con éxito.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de actualización incorrectos.',
  })
  @ApiResponse({ status: 403, description: 'Acceso denegado.' })
  @ApiResponse({
    status: 404,
    description:
      'No se encontró el medicamento utilizando el identificador provisto.',
  })
  async update(
    @Param('identifier') identifier: string,
    @Body() updateDto: UpdatePrescriptionItemDto,
  ) {
    return this.itemsService.update(identifier, updateDto);
  }

  @Delete(':identifier')
  @Roles('admin') // Solo el admin puede borrar
  @ApiOperation({
    summary: 'Remover un medicamento del catálogo (Solo Admin)',
    description:
      'Elimina un ítem de forma permanente utilizando su ID o su Nombre exacto.',
  })
  @ApiParam({
    name: 'identifier',
    description: 'ID único o Nombre exacto del ítem a eliminar',
  })
  @ApiResponse({
    status: 200,
    description: 'Medicamento removido del catálogo correctamente.',
  })
  @ApiResponse({ status: 403, description: 'Acceso denegado.' })
  @ApiResponse({ status: 404, description: 'Medicamento no encontrado.' })
  async remove(@Param('identifier') identifier: string) {
    return this.itemsService.remove(identifier);
  }
}
