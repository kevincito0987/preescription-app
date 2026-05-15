import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Requerimiento de image_775580.png: Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.use(helmet()); // Protege contra vulnerabilidades web conocidas
  app.enableCors(); // Permite que tu Frontend se conecte

  await app.listen(3000);
  console.log(`🚀 Application is running on: ${await app.getUrl()}`);
}
bootstrap();
