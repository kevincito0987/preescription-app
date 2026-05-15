import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GetPrescriptionItemFilterDto } from './dto/get-prescription-item-filter.dto';
import { Prisma } from '@prisma/client';
import { CreatePrescriptionItemDto } from './dto/create-prescription-item.dto';
import { UpdatePrescriptionItemDto } from './dto/update-prescription-item.dto';

@Injectable()
export class PrescriptionItemsService {
  // Definimos la selección de usuario para no repetir código y proteger datos sensibles
  private readonly userSelect = {
    id: true,
    fullName: true,
    email: true,
    role: true,
  };

  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: GetPrescriptionItemFilterDto) {
    const { id, name, prescriptionId, page = 1, limit = 10 } = filters;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Prisma.PrescriptionItemWhereInput = {
      AND: [
        id ? { id } : {},
        prescriptionId ? { prescriptionId } : {},
        name
          ? {
              name: {
                contains: name,
                mode: 'insensitive' as Prisma.QueryMode,
              },
            }
          : {},
      ],
    };

    // src/prescription-items/prescription-items.service.ts

    const [data, total] = await Promise.all([
      this.prisma.prescriptionItem.findMany({
        where,
        skip: skip,
        take: Number(limit),
        include: {
          prescription: {
            include: {
              patient: {
                include: {
                  user: {
                    // Entramos a la relación User del Patient
                    select: {
                      fullName: true,
                      email: true,
                    },
                  },
                },
              },
              author: {
                include: {
                  user: {
                    // Entramos a la relación User del Doctor (author)
                    select: {
                      fullName: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.prescriptionItem.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: Number(page),
        lastPage: Math.ceil(total / Number(limit)),
      },
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.prescriptionItem.findUnique({
      where: { id },
      include: {
        prescription: {
          include: {
            patient: { select: this.userSelect },
            author: { select: this.userSelect },
          },
        },
      },
    });

    if (!item) throw new NotFoundException('Medicamento no encontrado');
    return item;
  }

  async create(dto: CreatePrescriptionItemDto) {
    const prescriptionExists = await this.prisma.prescription.findUnique({
      where: { id: dto.prescriptionId },
    });

    if (!prescriptionExists) {
      throw new NotFoundException(
        `La prescripción con ID ${dto.prescriptionId} no existe`,
      );
    }

    return this.prisma.prescriptionItem.create({
      data: dto,
      include: {
        prescription: {
          include: {
            patient: { select: this.userSelect },
            author: { select: this.userSelect },
          },
        },
      },
    });
  }

  async update(identifier: string, dto: UpdatePrescriptionItemDto) {
    const item = await this.prisma.prescriptionItem.findFirst({
      where: {
        OR: [{ id: identifier }, { name: identifier }],
      },
    });

    if (!item) {
      throw new NotFoundException(`No se encontró el ítem con: ${identifier}`);
    }

    return this.prisma.prescriptionItem.update({
      where: { id: item.id },
      data: dto,
      include: {
        prescription: {
          include: {
            patient: { select: this.userSelect },
            author: { select: this.userSelect },
          },
        },
      },
    });
  }

  async remove(identifier: string) {
    const item = await this.prisma.prescriptionItem.findFirst({
      where: {
        OR: [{ id: identifier }, { name: identifier }],
      },
    });

    if (!item) {
      throw new NotFoundException(
        `No se pudo eliminar: No existe un medicamento con el identificador '${identifier}'`,
      );
    }

    return this.prisma.prescriptionItem.delete({
      where: { id: item.id },
    });
  }
}
