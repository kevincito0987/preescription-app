import { Module } from '@nestjs/common';
import { PrescriptionItemsService } from './prescription-items.service';
import { PrescriptionItemsController } from './prescription-items.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    PrismaModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minuto
        limit: 10, // máximo 10 peticiones por minuto para esta ruta
      },
    ]),
  ],
  controllers: [PrescriptionItemsController],
  providers: [
    PrescriptionItemsService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class PrescriptionItemsModule {}
