import { Module, forwardRef } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { ReferralController } from './referral.controller';
import { EventModule } from '../event/event.module';
import { RewardModule } from '../reward/reward.module';
import { BotModule } from '../bot/bot.module';

@Module({
  imports: [EventModule, RewardModule, forwardRef(() => BotModule)],
  controllers: [ReferralController],
  providers: [ReferralService],
  exports: [ReferralService],
})
export class ReferralModule {}
