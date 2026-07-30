import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Query,
  Inject,
  forwardRef,
  NotFoundException,
} from '@nestjs/common';
import { CommunityService } from './community.service';
import { StatsService } from '../stats/stats.service';
import { BotService } from '../bot/bot.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

export class BroadcastMessageDto {
  message!: string;
}

@Controller('communities')
export class CommunityController {
  constructor(
    private readonly communityService: CommunityService,
    private readonly statsService: StatsService,
    @Inject(forwardRef(() => BotService))
    private readonly botService: BotService,
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

  @Post(':id/broadcast')
  @UseGuards(JwtAuthGuard)
  async sendBroadcast(
    @Param('id') id: string,
    @Body() body: BroadcastMessageDto,
  ) {
    const community = await this.communityService.findOne(id);
    if (!community) {
      throw new NotFoundException(`Community ${id} not found`);
    }

    const chatId = community.telegramChatId || '-100123456789';
    await this.botService.sendGroupBroadcast(chatId, body.message);
    return { success: true, communityId: id, chatId };
  }
}
