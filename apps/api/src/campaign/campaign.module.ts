import { Module, forwardRef } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CampaignController } from './campaign.controller';
import { BotModule } from '../bot/bot.module';

@Module({
  imports: [forwardRef(() => BotModule)],
  controllers: [CampaignController],
  providers: [CampaignService],
  exports: [CampaignService],
})
export class CampaignModule {}
