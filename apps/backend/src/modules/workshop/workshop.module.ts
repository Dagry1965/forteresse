import { Module } from '@nestjs/common';
import { InterventionsController } from './interventions.controller';
import { InterventionsService } from './interventions.service';
import { WorkshopController } from './workshop.controller';
import { WorkshopService } from './workshop.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AuthModule } from '../../core/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [WorkshopController, InterventionsController],
  providers: [WorkshopService, InterventionsService],
  exports: [WorkshopService, InterventionsService],
})
export class WorkshopModule {}
