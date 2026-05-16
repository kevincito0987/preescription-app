import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

// 🟢 NUEVOS IMPORTS DE SWAGGER
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('General (Estado de la API)') // 🏷️ Agrupa este endpoint raíz en una sección limpia
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Verificar estado del servidor (Health Check)',
    description:
      'Endpoint raíz público para comprobar de manera rápida que el backend está encendido y respondiendo peticiones.',
  })
  @ApiResponse({
    status: 200,
    description:
      'El servidor está operando correctamente. Retorna un mensaje de bienvenida.',
    type: String, // Especificamos que la respuesta es un texto plano
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
