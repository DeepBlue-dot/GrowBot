import { Module } from '@nestjs/common';
import { MeService } from './me.service.js';
import { MeController } from './me.controller.js';

@Module({
  controllers: [MeController],
  providers: [MeService],
  exports: [MeService],
})
export class MeModule {}
