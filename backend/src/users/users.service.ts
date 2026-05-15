import {
  Injectable,
  ConflictException,
  NotFoundException,
  forwardRef,
  Inject,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthService } from '../auth/auth.service';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  // Definimos un objeto select reutilizable para no repetir código y ocultar la contraseña
  private readonly userSelect = {
    id: true,
    email: true,
    fullName: true,
    role: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
  };

  constructor(
    private readonly prisma: PrismaService,
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
      select: this.userSelect, // Oculta contraseña
    });
  }

  async findAll(query: { page?: number; limit?: number; role?: string }) {
    const { page = 1, limit = 10, role } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          deletedAt: null,
          role: role ? (role as any) : undefined,
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }, // Requerimiento: Ordenamiento desc
        select: this.userSelect,
      }),
      this.prisma.user.count({
        where: { deletedAt: null, role: role ? (role as any) : undefined },
      }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page: Number(page),
        lastPage: Math.ceil(total / Number(limit)),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: this.userSelect, // Oculta contraseña
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async findOneSecure(idToFind: string, currentUser: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: idToFind },
      // Aquí NO usamos select inicialmente para poder validar el rol del usuario encontrado
    });

    if (!user || user.deletedAt)
      throw new NotFoundException('Usuario no encontrado');

    // REGLAS DE ACCESO
    let hasAccess = false;
    if (currentUser.id === idToFind) hasAccess = true;
    if (currentUser.role === 'admin') hasAccess = true;
    if (currentUser.role === 'doctor' && user.role === 'patient')
      hasAccess = true;

    if (!hasAccess) {
      throw new ForbiddenException('No tienes permiso para ver este perfil');
    }

    // Eliminamos la contraseña manualmente antes de retornar
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findOneByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario no encontrado`);

    const data: any = { ...updateUserDto };
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    if (data.role) {
      data.role = data.role as Role;
    }

    return this.prisma.user.update({
      where: { id },
      data: data,
      select: this.userSelect, // Oculta contraseña
    });
  }

  async updateMe(id: string, updateUserDto: UpdateUserDto) {
    const { role, ...dataToUpdate } = updateUserDto;

    if (dataToUpdate.password) {
      dataToUpdate.password = await bcrypt.hash(dataToUpdate.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: this.userSelect, // Oculta contraseña
    });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    return await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() }, // Requerimiento: Soft Delete
      select: this.userSelect,
    });
  }
}
