import { Module, forwardRef } from '@nestjs/common';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';
import { StatsModule } from '../stats/stats.module';
import { BotModule } from '../bot/bot.module';

@Module({
  imports: [StatsModule, forwardRef(() => BotModule)],
  controllers: [CommunityController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}
