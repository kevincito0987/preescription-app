// 🔴 ELIMINAMOS ESTE IMPORT:
// import { PartialType } from '@nestjs/mapped-types';

// 🟢 LO IMPORTAMOS DESDE EL PAQUETE DE SWAGGER:
import { PartialType } from '@nestjs/swagger';
import { CreatePrescriptionItemDto } from './create-prescription-item.dto';

export class UpdatePrescriptionItemDto extends PartialType(
  CreatePrescriptionItemDto,
) {
  // Se mantiene limpio y vacío. Mágicamente Swagger heredará todo como opcional.
}
