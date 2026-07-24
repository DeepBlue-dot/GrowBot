import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CommunityItem {
  id: string;
  workspaceId: string;
  telegramChatId: string;
  title: string;
  username?: string;
  type: 'GROUP' | 'SUPERGROUP' | 'CHANNEL';
  memberCount: number;
  botIsAdmin: boolean;
}

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  private mockCommunities: CommunityItem[] = [
    {
      id: 'comm-1',
      workspaceId: 'ws-1',
      telegramChatId: '-100123456789',
      title: 'GrowBot Official Community',
      username: 'GrowBotOfficial',
      type: 'SUPERGROUP',
      memberCount: 4820,
      botIsAdmin: true,
    },
    {
      id: 'comm-2',
      workspaceId: 'ws-1',
      telegramChatId: '-100987654321',
      title: 'GrowBot Announcements',
      username: 'GrowBotNews',
      type: 'CHANNEL',
      memberCount: 12400,
      botIsAdmin: true,
    },
  ];

  async findByWorkspace(workspaceId?: string): Promise<CommunityItem[]> {
    try {
      const dbCommunities = await this.prisma.community.findMany({
        where: workspaceId ? { workspaceId } : undefined,
      });

      if (dbCommunities && dbCommunities.length > 0) {
        return dbCommunities.map((c) => ({
          id: c.id,
          workspaceId: c.workspaceId,
          telegramChatId: String(c.telegramChatId),
          title: c.title,
          username: c.username || undefined,
          type: c.type,
          memberCount: c.memberCount,
          botIsAdmin: c.botStatus === 'ACTIVE',
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Prisma findMany communities fallback: ${msg}`);
    }

    return this.mockCommunities;
  }

  async findOne(id: string): Promise<CommunityItem> {
    const communities = await this.findByWorkspace();
    const community = communities.find((c) => c.id === id);
    if (!community) {
      throw new NotFoundException(`Community ${id} not found`);
    }
    return community;
  }
}
