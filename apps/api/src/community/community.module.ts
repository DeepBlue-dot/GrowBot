import { Module } from '@nestjs/common';
import { CommunityService } from './community.service.js';
import { CommunityController } from './community.controller.js';
import { StatsModule } from '../stats/stats.module.js';

@Module({
  imports: [StatsModule],
  controllers: [CommunityController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}
