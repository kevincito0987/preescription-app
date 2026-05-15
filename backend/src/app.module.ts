import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrescriptionItemsModule } from './prescription-items/prescription-items.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Hace que el ConfigService esté disponible en todos los módulos
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PrescriptionItemsModule,
  ],
})
export class AppModule {}
