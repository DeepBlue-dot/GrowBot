import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/decorators/auth-user.decorator';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get()
  async findAll(@AuthUser('sub') userId: string) {
    return this.workspaceService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.workspaceService.findOne(id);
  }

  @Post()
  async create(@Body() body: { name: string; slug: string; plan?: 'FREE' | 'PRO' | 'ENTERPRISE' }) {
    return this.workspaceService.create(body);
  }
}
