import { Module } from '@nestjs/common';
import { AuthModule } from '../../core/auth/auth.module';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [AuthModule, SharedModule],
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
