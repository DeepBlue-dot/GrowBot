import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from './dto/workspace.dto';
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
  async create(
    @Body() body: CreateWorkspaceDto,
    @AuthUser('sub') userId?: string,
  ) {
    return this.workspaceService.create(body, userId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateWorkspaceDto,
  ) {
    return this.workspaceService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.workspaceService.remove(id);
  }
}
