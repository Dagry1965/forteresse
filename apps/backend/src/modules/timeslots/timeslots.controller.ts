// src/modules/timeslots/timeslots.controller.ts

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TimeSlotsService } from './timeslots.service';
import { CreateTimeslotDto } from './dto/create-timeslot.dto';
import { UpdateTimeslotDto } from './dto/update-timeslot.dto';

@Controller('time-slots')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class TimeSlotsController {
  constructor(private readonly service: TimeSlotsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Query('workspaceId') workspaceId: string,
    @Body() dto: CreateTimeslotDto,
  ) {
    return this.service.create(workspaceId, dto);
  }

  @Get()
  findAll(@Query('workspaceId') workspaceId: string) {
    return this.service.findAll(workspaceId);
  }

  @Get('available')
  findAvailable(
    @Query('workspaceId') workspaceId: string,
    @Query('date') date: string,
  ) {
    return this.service.findAvailable(workspaceId, date);
  }

  @Get(':id')
  findOne(
    @Query('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.service.findOne(workspaceId, id);
  }

  @Patch(':id')
  update(
    @Query('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTimeslotDto,
  ) {
    return this.service.update(workspaceId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancel(
    @Query('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    await this.service.cancel(workspaceId, id);
  }
}