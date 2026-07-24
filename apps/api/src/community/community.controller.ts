import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('communities')
@UseGuards(JwtAuthGuard)
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get()
  async findByWorkspace(@Query('workspaceId') workspaceId: string) {
    return this.communityService.findByWorkspace(workspaceId || 'ws-1');
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.communityService.findOne(id);
  }
}
