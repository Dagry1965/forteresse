import {
  Controller,
  UseGuards,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Headers,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from '../../core/auth/users.service';
import { CreateUserDto } from '../../core/auth/dto/create-user.dto';
import { UpdateUserDto } from '../../core/auth/dto/update-user.dto';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/roles.guard';
import { Roles } from '../../core/auth/roles.decorator';
import { WorkspaceGuard } from '../../core/auth/workspace.guard';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
  };
};

@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
@Roles('ADMIN')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(
    @Headers('x-workspace-id') workspaceId: string,
    @Body() dto: CreateUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.create(workspaceId, dto, req.user.userId);
  }

  @Get()
  findAll(@Headers('x-workspace-id') workspaceId: string) {
    return this.usersService.findAll(workspaceId);
  }

  @Get(':id')
  findOne(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.usersService.findOne(id, workspaceId);
  }

  @Patch(':id')
  update(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.update(
      workspaceId,
      id,
      dto,
      req.user.userId,
    );
  }

  @Patch(':id/restore')
  restore(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.restore(workspaceId, id, req.user.userId);
  }
  @Delete(':id')
  remove(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.remove(workspaceId, id, req.user.userId);
  }
}


