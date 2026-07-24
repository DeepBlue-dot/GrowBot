import { Injectable, NotFoundException } from '@nestjs/common';

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

  findByWorkspace(workspaceId: string): Promise<CommunityItem[]> {
    return Promise.resolve(
      this.mockCommunities.filter((c) => c.workspaceId === workspaceId),
    );
  }

  findOne(id: string): Promise<CommunityItem> {
    const community = this.mockCommunities.find((c) => c.id === id);
    if (!community) {
      throw new NotFoundException(`Community ${id} not found`);
    }
    return Promise.resolve(community);
  }
}
