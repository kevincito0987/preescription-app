import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  Req,
  ForbiddenException,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserBaseDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';

// 🟢 NUEVOS IMPORTS DE SWAGGER
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam, 
  ApiQuery 
} from '@nestjs/swagger';

@ApiTags('Users (Usuarios y Roles)') // 🏷️ Agrupa todas las operaciones de usuarios en la UI
@ApiBearerAuth('JWT-auth') // 🔒 Candado global para todo el controlador
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Obtener mi propio perfil', 
    description: 'Recupera la información detallada del usuario actualmente autenticado mediante el token.' 
  })
  @ApiResponse({ status: 200, description: 'Perfil retornado con éxito.' })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido.' })
  async getMe(@Req() req: any) {
    return this.usersService.findOne(req.user.id);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Listar todos los usuarios (Solo Admin)', 
    description: 'Permite al Administrador visualizar el universo completo de usuarios con soporte para paginación y filtrado por rol.' 
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página para la paginación' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Cantidad de registros por página' })
  @ApiQuery({ name: 'role', required: false, type: String, description: 'Filtrar usuarios por rol (admin, doctor, patient)' })
  @ApiResponse({ status: 200, description: 'Listado devuelto con éxito.' })
  @ApiResponse({ status: 403, description: 'No tienes permisos de Administrador para ver esto.' })
  findAll(@Query() query: { page?: number; limit?: number; role?: string }) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Roles('admin', 'doctor', 'patient')
  @ApiOperation({ 
    summary: 'Obtener usuario por ID (Acceso Seguro)', 
    description: 'Recupera un usuario específico aplicando reglas de negocio basadas en el rol del solicitante.' 
  })
  @ApiParam({ name: 'id', description: 'ID único del usuario a buscar' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado con éxito.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.usersService.findOneSecure(id, req.user);
  }

  @Post('patient')
  @ApiOperation({ summary: 'Crear un usuario con rol de Paciente' })
  @ApiResponse({ status: 201, description: 'Paciente creado con éxito.' })
  @ApiResponse({ status: 400, description: 'Estructura o datos enviados inválidos.' })
  createPatient(@Body() dto: CreateUserBaseDto) {
    return this.usersService.createWithRole(dto, 'patient');
  }

  @Post('doctor')
  @Roles('admin')
  @ApiOperation({ summary: 'Crear un usuario con rol de Doctor (Solo Admin)' })
  @ApiResponse({ status: 201, description: 'Doctor registrado con éxito.' })
  @ApiResponse({ status: 403, description: 'Operación denegada. Solo permitida para Administradores.' })
  createDoctor(@Body() dto: CreateUserBaseDto) {
    return this.usersService.createWithRole(dto, 'doctor');
  }

  @Post('admin')
  @ApiOperation({ summary: 'Crear un usuario con rol de Administrador' })
  @ApiResponse({ status: 201, description: 'Administrador registrado con éxito.' })
  createAdmin(@Body() dto: CreateUserBaseDto) {
    return this.usersService.createWithRole(dto, 'admin');
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Actualizar mis propios datos de perfil' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  async updateMe(@Req() req: any, @Body() updateUserDto: UpdateUserDto) {
    console.log('Usuario decodificado del token:', req.user);

    if (!req.user || !req.user.id) {
      throw new UnauthorizedException(
        'El token no contiene un ID de usuario válido',
      );
    }

    return this.usersService.updateMe(req.user.id, updateUserDto);
  }

  @Patch(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Actualizar datos de cualquier usuario por ID (Solo Admin)' })
  @ApiParam({ name: 'id', description: 'ID del usuario que se desea modificar' })
  @ApiResponse({ status: 200, description: 'Usuario modificado con éxito.' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes.' })
  async updateAnyUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Dar de baja mi propia cuenta (Autoeleminación)' })
  @ApiResponse({ status: 200, description: 'Cuenta eliminada con éxito.' })
  async deleteMe(@Req() req: any) {
    return this.usersService.remove(req.user.id);
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Eliminar cualquier usuario del sistema (Solo Admin)' })
  @ApiParam({ name: 'id', description: 'ID del usuario a remover permanentemente' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado por el Administrador.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado.' })
  async deleteUser(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}