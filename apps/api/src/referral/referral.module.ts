import { Module } from '@nestjs/common';
import { ReferralService } from './referral.service.js';
import { ReferralController } from './referral.controller.js';
import { EventModule } from '../event/event.module.js';
import { RewardModule } from '../reward/reward.module.js';

@Module({
  imports: [EventModule, RewardModule],
  controllers: [ReferralController],
  providers: [ReferralService],
  exports: [ReferralService],
})
export class ReferralModule {}
