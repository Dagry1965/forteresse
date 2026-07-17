import { Module } from '@nestjs/common';
import { TimeSlotsService } from './timeslots.service';
import { TimeSlotsController } from './timeslots.controller';
import { PrismaService } from '../../core/prisma/prisma.service';

@Module({
  controllers: [TimeSlotsController],
  providers: [TimeSlotsService, PrismaService],
  exports: [TimeSlotsService],
})
export class TimeSlotsModule {}
