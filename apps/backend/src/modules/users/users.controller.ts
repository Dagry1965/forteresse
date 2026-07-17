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
import { UsersService } from '../../core/auth/users.service';
import { CreateUserDto } from '../../core/auth/dto/create-user.dto';
import { UpdateUserDto } from '../../core/auth/dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  findAll(@Query('workspaceId') workspaceId?: string) {
    return this.usersService.findAll(workspaceId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.usersService.findOne(id, workspaceId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
