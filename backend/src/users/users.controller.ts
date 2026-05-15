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
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // RUTA: Obtener mi propio perfil
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: any) {
    // El ID viene del token decodificado por el JwtStrategy
    return this.usersService.findOne(req.user.id);
  }

  @Get()
  @Roles('admin')
  findAll(@Query() query: { page?: number; limit?: number; role?: string }) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Roles('admin', 'doctor', 'patient')
  findOne(@Param('id') id: string, @Req() req: any) {
    // Pasamos el usuario completo que viene del token
    return this.usersService.findOneSecure(id, req.user);
  }

  // RUTA 1: Para cualquier usuario logueado (Me)
  @Patch('me')
  @UseGuards(JwtAuthGuard) // Asegúrate de que esto esté aquí o arriba de la clase
  async updateMe(@Req() req: any, @Body() updateUserDto: UpdateUserDto) {
    // Agrega este console.log para debuguear en la terminal
    console.log('Usuario decodificado del token:', req.user);

    if (!req.user || !req.user.id) {
      throw new UnauthorizedException(
        'El token no contiene un ID de usuario válido',
      );
    }

    return this.usersService.updateMe(req.user.id, updateUserDto);
  }

  @Post()
  @Roles('admin')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // RUTA 2: Para que el Admin edite a otros
  @Patch(':id')
  @Roles('admin') // Solo alguien con rol 'admin' puede entrar aquí
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateAnyUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    // Esta ruta permite al Admin editar a cualquier usuario por su ID
    return this.usersService.update(id, updateUserDto);
  }
  @Delete('me')
  @UseGuards(JwtAuthGuard)
  async deleteMe(@Req() req: any) {
    // Cualquier usuario logueado puede borrar su propia cuenta
    return this.usersService.remove(req.user.id);
  }

  @Delete(':id')
  @Roles('admin') // Solo el Admin puede acceder a esta ruta
  @UseGuards(JwtAuthGuard, RolesGuard)
  async deleteUser(@Param('id') id: string) {
    // El Admin puede borrar cualquier cuenta pasando el ID en la URL
    return this.usersService.remove(id);
  }
}
