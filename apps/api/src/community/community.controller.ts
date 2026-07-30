import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { CommunityService } from './community.service';
import { StatsService } from '../stats/stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('communities')
export class CommunityController {
  constructor(
    private readonly communityService: CommunityService,
    private readonly statsService: StatsService,
  ) {}

  @Get()
  async findByWorkspace(@Query('workspaceId') workspaceId: string) {
    return this.communityService.findByWorkspace(workspaceId || 'ws-1');
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.communityService.findOne(id);
  }

  @Get(':id/stats')
  async getCommunityStats(
    @Param('id') id: string,
    @Query('days') days?: string,
  ) {
    const parsedDays = days ? parseInt(days, 10) : 7;
    return this.statsService.getCommunityStats(id, parsedDays);
  }
}
