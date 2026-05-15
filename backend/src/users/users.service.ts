import {
  Injectable,
  ConflictException,
  NotFoundException,
  forwardRef,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthService } from '../auth/auth.service';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client'; // <--- IMPORTA EL ENUM AQUÍ

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService, // Este ya lo tiene
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('El email ya existe');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        ...dto,
        password: hashedPassword,
      },
      select: { id: true, email: true, fullName: true, role: true },
    });
  }

  // REQUERIMIENTO: Solo traer usuarios no eliminados (Soft Delete)
  async findAll() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async findOneByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null }, // Usando el filtro de soft delete que vi en tus tablas
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuario no encontrado`);
    }

    // Clonamos el DTO para no modificar el original
    const data: any = { ...updateUserDto };

    // 1. Manejo del Password: si viene en el body, se hashea
    if (data.password) {
      const bcrypt = await import('bcrypt');
      data.password = await bcrypt.hash(data.password, 10);
    }

    // 2. Manejo del Role: Forzamos que sea el tipo Enum de Prisma
    if (data.role) {
      data.role = data.role as Role;
    }

    return this.prisma.user.update({
      where: { id },
      data: data,
    });
  }

  async updateMe(id: string, updateUserDto: UpdateUserDto) {
    // Si el DTO trae un role, asegúrate de que Prisma lo vea como el Enum Role
    const data: any = { ...updateUserDto };

    if (data.role) {
      data.role = data.role as Role;
    }

    if (data.password) {
      const bcrypt = await import('bcrypt');
      data.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: data, // <--- PASA EL OBJETO CON EL CAST HECHO
    });
  }
  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // En lugar de .delete, usamos .update
    return await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
