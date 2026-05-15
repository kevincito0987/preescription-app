import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { PrescriptionItemsService } from './prescription-items.service';
import { GetPrescriptionItemFilterDto } from './dto/get-prescription-item-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('prescription-items')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrescriptionItemsController {
  constructor(private readonly itemsService: PrescriptionItemsService) {}

  @Get()
  @Roles('admin', 'doctor')
  findAll(@Query() filters: GetPrescriptionItemFilterDto) {
    // Los pipes validarán y transformarán los datos automáticamente
    return this.itemsService.findAll(filters);
  }

  @Get(':id')
  @Roles('admin', 'doctor')
  findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }
}
