import { Module, forwardRef } from '@nestjs/common';
import { RewardService } from './reward.service';
import { RewardController } from './reward.controller';
import { EventModule } from '../event/event.module';
import { BotModule } from '../bot/bot.module';

@Module({
  imports: [EventModule, forwardRef(() => BotModule)],
  controllers: [RewardController],
  providers: [RewardService],
  exports: [RewardService],
})
export class RewardModule {}
