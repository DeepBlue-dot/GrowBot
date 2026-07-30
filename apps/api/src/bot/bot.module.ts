import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotController } from './bot.controller';
import { ReferralModule } from '../referral/referral.module';
import { CommunityModule } from '../community/community.module';
import { StatsModule } from '../stats/stats.module';
import { MeModule } from '../me/me.module';

@Module({
  imports: [ReferralModule, CommunityModule, StatsModule, MeModule],
  controllers: [BotController],
  providers: [BotService],
  exports: [BotService],
})
export class BotModule {}
