import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CampaignService } from './campaign.service.js';
import { CreateCampaignDto, UpdateCampaignDto } from './dto/campaign.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get()
  async findAll(@Query('communityId') communityId?: string) {
    return this.campaignService.findAll(communityId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.campaignService.findOne(id);
  }

  @Get(':id/export')
  async exportCampaignCsv(@Param('id') id: string, @Res() res: Response) {
    const csvContent = await this.campaignService.exportCampaignCsv(id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="campaign-${id}-export.csv"`,
    );
    return res.status(200).send(csvContent);
  }

  @Get(':id/leaderboard')
  async getLeaderboard(@Param('id') id: string) {
    return this.campaignService.getLeaderboard(id);
  }

  @Post(':id/join')
  async joinCampaign(
    @Param('id') id: string,
    @Body('userId') userId?: string,
  ) {
    return this.campaignService.joinCampaign(id, userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: CreateCampaignDto) {
    return this.campaignService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() body: UpdateCampaignDto) {
    return this.campaignService.update(id, body);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body('status')
    status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED',
  ) {
    return this.campaignService.updateStatus(id, status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    return this.campaignService.remove(id);
  }
}
