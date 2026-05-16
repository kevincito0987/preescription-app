import { Test, TestingModule } from '@nestjs/testing';
import { PrescriptionsService } from './prescriptions.service';
import { PrismaService } from '../../prisma/prisma.service'; // Mantenemos tu ruta estructurada con ../../
import * as puppeteer from 'puppeteer';

// Mockear Puppeteer por completo para evitar abrir navegadores reales en pruebas
jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setContent: jest.fn().mockResolvedValue(null),
      pdf: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    }),
    close: jest.fn().mockResolvedValue(null),
  }),
}));

describe('PrescriptionsService', () => {
  let service: PrescriptionsService;
  let prisma: PrismaService;

  // Creamos un mock con la estructura interna exacta que requiere Prisma en NestJS
  const mockPrismaService = {
    prescription: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrescriptionsService,
        {
          provide: PrismaService, // Token que busca NestJS en el constructor
          useValue: mockPrismaService, // Objeto simulado que le entregamos
        },
      ],
    }).compile();

    service = module.get<PrescriptionsService>(PrescriptionsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generatePdf', () => {
    it('should generate a PDF buffer successfully when prescription exists', async () => {
      const mockPrescription = {
        id: 'cmp7lqfkk00002yqw2shzjag3',
        medicalCode: 'RX-7960-6769',
        createdAt: new Date(),
        status: 'consumed',
        consumedAt: new Date(),
        notes: 'Tomar abundante agua.',
        patient: {
          user: {
            fullName: 'John Doe',
            email: 'patient@test.com',
          },
        },
        author: {
          specialty: 'Diagnóstico Médico',
          user: {
            fullName: 'Dr. Gregory House',
            email: 'author@test.com',
          },
        },
        items: [
          {
            name: 'Acetaminofén 500mg',
            dosage: '500mg',
            quantity: 10,
            instructions: 'Cada 8 horas por 3 días',
          },
        ],
      };

      jest.clearAllMocks();
      mockPrismaService.prescription.findUnique.mockResolvedValue(
        mockPrescription,
      );

      // 🚀 Llamada corregida con el nombre exacto
      const result = await service.generatePrescriptionPdf(mockPrescription.id);

      // Verificaciones
      expect(mockPrismaService.prescription.findUnique).toHaveBeenCalledWith({
        where: { id: mockPrescription.id },
        include: expect.any(Object),
      });

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
