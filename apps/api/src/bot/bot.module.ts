import { Module } from '@nestjs/common';
import { BotService } from './bot.service.js';
import { BotController } from './bot.controller.js';
import { ReferralModule } from '../referral/referral.module.js';
import { CommunityModule } from '../community/community.module.js';
import { StatsModule } from '../stats/stats.module.js';

@Module({
  imports: [ReferralModule, CommunityModule, StatsModule],
  controllers: [BotController],
  providers: [BotService],
  exports: [BotService],
})
export class BotModule {}
