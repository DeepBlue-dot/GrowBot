import { Controller, Get, Param, Query } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get(':communityId')
  async getCommunityStats(
    @Param('communityId') communityId: string,
    @Query('days') days?: string,
  ) {
    const parsedDays = days ? parseInt(days, 10) : 7;
    return this.statsService.getCommunityStats(communityId, parsedDays);
  }
}
