import { Module } from '@nestjs/common';
import { CampaignService } from './campaign.service.js';
import { CampaignController } from './campaign.controller.js';
import { BotModule } from '../bot/bot.module.js';

@Module({
  imports: [BotModule],
  controllers: [CampaignController],
  providers: [CampaignService],
  exports: [CampaignService],
})
export class CampaignModule {}
