import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { SchedulingService } from './scheduling.service';
import { SequencingService } from './sequencing.service';

@Module({
  imports: [
    PrismaModule,
  ],
  providers: [
    SchedulingService,
    SequencingService,
  ],
  exports: [
    SchedulingService,
    SequencingService,
  ],
})
export class SharedModule {}