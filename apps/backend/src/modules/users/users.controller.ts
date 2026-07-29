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
} from '@nestjs/common';
import { UsersService } from '../../core/auth/users.service';
import { CreateUserDto } from '../../core/auth/dto/create-user.dto';
import { UpdateUserDto } from '../../core/auth/dto/update-user.dto';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/roles.guard';
import { Roles } from '../../core/auth/roles.decorator';
import { WorkspaceGuard } from '../../core/auth/workspace.guard';

@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
@Roles('ADMIN')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(
    @Headers('x-workspace-id') workspaceId: string,
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.create(workspaceId, dto);
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
  ) {
    return this.usersService.update(workspaceId, id, dto);
  }

  @Patch(':id/restore')
  restore(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.usersService.restore(workspaceId, id);
  }
  @Delete(':id')
  remove(
    @Headers('x-workspace-id') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.usersService.remove(workspaceId, id);
  }
}


