import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  // CREATE
  @Post()
  create(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(dto);
  }

  // FIND ALL
  @Get()
  findAll(@Query('workspaceId') workspaceId?: string) {
    return this.suppliersService.findAll(workspaceId);
  }

  // FIND ONE
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.suppliersService.findOne(id, workspaceId);
  }

  // UPDATE
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(id, workspaceId, dto);
  }

  // DELETE
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }
}
