import { Module } from '@nestjs/common';
import { TimeSlotsService } from './timeslots.service';
import { TimeSlotsController } from './timeslots.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AuthModule } from '../../core/auth/auth.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [PrismaModule, AuthModule, SharedModule],
  controllers: [TimeSlotsController],
  providers: [TimeSlotsService],
  exports: [TimeSlotsService],
})
export class TimeSlotsModule {}
