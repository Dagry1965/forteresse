import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { SequencingService } from './sequencing.service';

@Module({
  imports: [
    PrismaModule,
  ],
  providers: [
    SequencingService,
  ],
  exports: [
    SequencingService,
  ],
})
export class SharedModule {}