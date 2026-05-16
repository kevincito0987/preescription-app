import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
// 🟢 Importamos los módulos de Swagger
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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

  // 🛠️ CONFIGURACIÓN DE SWAGGER UI
  const config = new DocumentBuilder()
    .setTitle('Prescription App API')
    .setDescription(
      'Sistema para la Gestión, Auditoría e Historial de Prescripciones Médicas',
    )
    .setVersion('1.0')
    // Configura el candado global para que puedas autenticarte en Swagger pegando tu Token JWT
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa tu token de acceso JWT obtenido del login',
        in: 'header',
      },
      'JWT-auth', // Nombre de referencia que usarás en los @ApiBearerAuth() de tus controladores
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Ruta donde estará disponible la documentación interactiva
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000, '0.0.0.0');
  // Consolas informativas bien estructuradas
  console.log(`\n======================================================`);
  console.log(`🚀 Servidor backend corriendo en: ${await app.getUrl()}`);
  console.log(`📄 Documentación Swagger UI en: ${await app.getUrl()}/api/docs`);
  console.log(`======================================================\n`);
}
bootstrap();
