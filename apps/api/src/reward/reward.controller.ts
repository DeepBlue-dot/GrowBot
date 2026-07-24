import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { RewardService, RewardItem } from './reward.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('rewards')
export class RewardController {
  constructor(private readonly rewardService: RewardService) {}

  @Get()
  async findAll() {
    return this.rewardService.findAll();
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(@Param('id') id: string, @Body('status') status: RewardItem['status']) {
    return this.rewardService.updateStatus(id, status);
  }
}
