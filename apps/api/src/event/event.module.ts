import { Module } from '@nestjs/common';
import { EventService } from './event.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
