import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { WorkspaceGuard } from '../../core/auth/workspace.guard';
import { RolesGuard } from '../../core/auth/roles.guard';
import { Roles } from '../../core/auth/roles.decorator';
import { USER_ROLE } from '../../../../../shared/constants/status.constants';
import { CreateTimeslotDto } from './dto/create-timeslot.dto';
import { TimeSlotsService } from './timeslots.service';
import { UpdateTimeslotDto } from './dto/update-timeslot.dto';

@Controller('time-slots')
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
@Roles(
  USER_ROLE.ADMIN,
  USER_ROLE.RECEPTION,
  USER_ROLE.WORKSHOP,
  USER_ROLE.MECHANIC,
  USER_ROLE.READ_ONLY,
)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class TimeSlotsController {
  constructor(private readonly service: TimeSlotsService) {}

  @Post()
  @Roles(
    USER_ROLE.ADMIN,
    USER_ROLE.RECEPTION,
  )
  @HttpCode(HttpStatus.CREATED)
  create(
    @Headers('x-workspace-id') workspaceId: string,
    @Body() dto: CreateTimeslotDto,
  ) {
    return this.service.create(workspaceId, dto);
  }

  @Get()
  findAll(
    @Headers('x-workspace-id') workspaceId: string,
  ) {
    return this.service.findAll(workspaceId);
  }

  @Get('available')
  findAvailable(
    @Headers('x-workspace-id') workspaceId: string,
    @Query('date') date: string,
  ) {
    return this.service.findAvailable(workspaceId, date);
  }

  @Get(':id')
  findOne(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.service.findOne(workspaceId, id);
  }

  @Patch(':id/cancel')
  @Roles(
    USER_ROLE.ADMIN,
    USER_ROLE.RECEPTION,
  )
  cancel(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.service.cancel(workspaceId, id);
  }

  @Patch(':id/restore')
  @Roles(
    USER_ROLE.ADMIN,
    USER_ROLE.RECEPTION,
  )
  restore(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.service.restore(workspaceId, id);
  }

  @Patch(':id')
  @Roles(
    USER_ROLE.ADMIN,
    USER_ROLE.RECEPTION,
  )
  update(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTimeslotDto,
  ) {
    return this.service.update(workspaceId, id, dto);
  }

  @Delete(':id')
  @Roles(
    USER_ROLE.ADMIN,
    USER_ROLE.RECEPTION,
  )
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    await this.service.remove(workspaceId, id);
  }
}
