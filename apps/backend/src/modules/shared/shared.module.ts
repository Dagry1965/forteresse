import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { NormalizationService } from './normalization.service';
import { SchedulingService } from './scheduling.service';
import { SequencingService } from './sequencing.service';

@Module({
  imports: [
    PrismaModule,
  ],
  providers: [
    NormalizationService,
    SchedulingService,
    SequencingService,
  ],
  exports: [
    NormalizationService,
    SchedulingService,
    SequencingService,
  ],
})
export class SharedModule {}