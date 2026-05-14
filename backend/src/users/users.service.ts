import {
  Injectable,
  ConflictException,
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthService } from '../auth/auth.service';
import * as bcrypt from 'bcrypt';

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

  // REQUERIMIENTO: Implementación de Soft Delete
  async remove(id: string) {
    await this.findOne(id); // Verificar que existe y no está borrado
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
  async findOneByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null }, // Usando el filtro de soft delete que vi en tus tablas
    });
  }
}
