import { Module } from '@nestjs/common';
import { TimeSlotsService } from './timeslots.service';
import { TimeSlotsController } from './timeslots.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AuthModule } from '../../core/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TimeSlotsController],
  providers: [TimeSlotsService],
  exports: [TimeSlotsService],
})
export class TimeSlotsModule {}
