import { Test, TestingModule } from '@nestjs/testing';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';
import type { Response } from 'express';
import { Reflector } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';

// Evitamos que Jest intente leer el código ESM nativo de Puppeteer
jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setContent: jest.fn().mockResolvedValue(null),
      pdf: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    }),
    close: jest.fn().mockResolvedValue(null),
  }),
}));

describe('PrescriptionsController', () => {
  let controller: PrescriptionsController;
  let service: PrescriptionsService;

  const mockPrescriptionsService = {
    generatePrescriptionPdf: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            ttl: 60000,
            limit: 10,
          },
        ]),
      ],
      controllers: [PrescriptionsController],
      providers: [
        { provide: PrescriptionsService, useValue: mockPrescriptionsService },
        Reflector,
      ],
    }).compile();

    controller = module.get<PrescriptionsController>(PrescriptionsController);
    service = module.get<PrescriptionsService>(PrescriptionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('downloadPdf', () => {
    it('should set appropriate headers and send PDF buffer', async () => {
      const id = 'cmp7lqfkk00002yqw2shzjag3';
      const mockBuffer = Buffer.from([1, 2, 3]);

      // Mock de la respuesta Express adaptado a .set() y .end()
      const mockRes = {
        set: jest.fn().mockReturnThis(),
        end: jest.fn().mockReturnThis(),
      } as unknown as Response;

      mockPrescriptionsService.generatePrescriptionPdf.mockResolvedValue(
        mockBuffer,
      );

      // 🟢 CORRECCIÓN: Llamamos al nombre exacto del método de tu controlador
      await controller.downloadPdf(id, mockRes);

      // Verificamos que se configuren las cabeceras correctamente
      expect(mockRes.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Type': 'application/pdf',
          'Content-Disposition': expect.stringContaining(
            'attachment; filename=prescripcion-',
          ),
          'Content-Length': mockBuffer.length,
        }),
      );

      // 🟢 CORRECCIÓN: Verificamos con .end() que es como despachas el buffer en el controlador
      expect(mockRes.end).toHaveBeenCalledWith(mockBuffer);
    });
  });
});
