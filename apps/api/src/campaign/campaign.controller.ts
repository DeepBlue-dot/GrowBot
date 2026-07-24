import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CampaignService, CampaignItem } from './campaign.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get()
  async findAll() {
    return this.campaignService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.campaignService.findOne(id);
  }

  @Get(':id/leaderboard')
  async getLeaderboard(@Param('id') id: string) {
    return this.campaignService.getLeaderboard(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: Partial<CampaignItem>) {
    return this.campaignService.create(body);
  }
}
