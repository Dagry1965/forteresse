import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { WorkspaceGuard } from '../../core/auth/workspace.guard';
import { RolesGuard } from '../../core/auth/roles.guard';
import { Roles } from '../../core/auth/roles.decorator';
import { USER_ROLE } from '../../../../../shared/constants/status.constants';

@Controller('suppliers')
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.STOCK,
  USER_ROLE.ACCOUNTING,
  USER_ROLE.READ_ONLY,
)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @Roles(
    USER_ROLE.ADMIN,
    USER_ROLE.STOCK,
  )
  create(
    @Headers('x-workspace-id') workspaceId: string,
    @Body() dto: CreateSupplierDto,
  ) {
    return this.suppliersService.create(workspaceId, dto);
  }

  @Get()
  findAll(
    @Headers('x-workspace-id') workspaceId: string,
  ) {
    return this.suppliersService.findAll(workspaceId);
  }

  @Get(':id')
  findOne(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.suppliersService.findOne(workspaceId, id);
  }

  @Patch(':id')
  @Roles(
    USER_ROLE.ADMIN,
    USER_ROLE.STOCK,
  )
  update(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(workspaceId, id, dto);
  }

  @Delete(':id')
  @Roles(
    USER_ROLE.ADMIN,
    USER_ROLE.STOCK,
  )
  remove(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.suppliersService.remove(workspaceId, id);
  }
}
