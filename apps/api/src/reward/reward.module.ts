import { Module } from '@nestjs/common';
import { RewardService } from './reward.service.js';
import { RewardController } from './reward.controller.js';
import { EventModule } from '../event/event.module.js';

@Module({
  imports: [EventModule],
  controllers: [RewardController],
  providers: [RewardService],
  exports: [RewardService],
})
export class RewardModule {}
