import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GetPrescriptionItemFilterDto } from './dto/get-prescription-item-filter.dto';
import { Prisma } from '@prisma/client';
import { CreatePrescriptionItemDto } from './dto/create-prescription-item.dto';
import { UpdatePrescriptionItemDto } from './dto/update-prescription-item.dto';

@Injectable()
export class PrescriptionItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: GetPrescriptionItemFilterDto) {
    // Le damos valores por defecto aquí también por seguridad
    const { id, name, prescriptionId, page = 1, limit = 10 } = filters;

    // Convertimos a número para evitar errores matemáticos
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

    const [data, total] = await Promise.all([
      this.prisma.prescriptionItem.findMany({
        where,
        skip: skip,
        take: Number(limit),
        include: { prescription: true },
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
    // CORRECCIÓN: Usar directamente this.prisma.[tabla]
    const item = await this.prisma.prescriptionItem.findUnique({
      where: { id },
      include: { prescription: true },
    });

    if (!item) throw new NotFoundException('Medicamento no encontrado');
    return item;
  }

  async create(dto: CreatePrescriptionItemDto) {
    // 1. Verificar si la prescripción existe
    const prescriptionExists = await this.prisma.prescription.findUnique({
      where: { id: dto.prescriptionId },
    });

    if (!prescriptionExists) {
      throw new NotFoundException(
        `La prescripción con ID ${dto.prescriptionId} no existe`,
      );
    }

    // 2. Crear el ítem
    return this.prisma.prescriptionItem.create({
      data: dto,
      include: {
        prescription: true, // Para confirmar la relación en la respuesta
      },
    });
  }

  async update(identifier: string, dto: UpdatePrescriptionItemDto) {
    // Buscamos por ID o por Nombre exacto
    const item = await this.prisma.prescriptionItem.findFirst({
      where: {
        OR: [{ id: identifier }, { name: identifier }],
      },
    });

    if (!item) {
      throw new NotFoundException(`No se encontró el ítem con: ${identifier}`);
    }

    return this.prisma.prescriptionItem.update({
      where: { id: item.id }, // Siempre actualizamos por el ID interno
      data: dto,
    });
  }

  async remove(identifier: string) {
    // 1. Buscamos el ítem por ID o Nombre para saber qué borrar
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

    // 2. Eliminación física por el ID único
    return this.prisma.prescriptionItem.delete({
      where: { id: item.id },
    });
  }
}
