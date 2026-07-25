import { Controller, Get, Query } from '@nestjs/common';
import { MeService } from './me.service.js';

@Controller('me')
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get('campaigns')
  async getMyCampaigns(@Query('userId') userId?: string) {
    return this.meService.getMyCampaigns(userId || '987654321');
  }

  @Get('referrals')
  async getMyReferrals(@Query('userId') userId?: string) {
    return this.meService.getMyReferrals(userId || '987654321');
  }
}
