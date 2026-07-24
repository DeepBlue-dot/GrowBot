import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface WorkspaceItem {
  id: string;
  name: string;
  slug: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  memberLimit: number;
  communitiesCount: number;
}

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  private mockWorkspaces: WorkspaceItem[] = [
    {
      id: 'ws-1',
      name: 'Crypto Alpha Hub',
      slug: 'crypto-alpha',
      plan: 'PRO',
      memberLimit: 10000,
      communitiesCount: 3,
    },
    {
      id: 'ws-2',
      name: 'Web3 Gaming Guild',
      slug: 'web3-gaming',
      plan: 'FREE',
      memberLimit: 1000,
      communitiesCount: 1,
    },
  ];

  async findAll(ownerId: string): Promise<WorkspaceItem[]> {
    try {
      const dbWorkspaces = await (this.prisma as any).workspace?.findMany({
        where: { ownerId },
        include: { _count: { select: { communities: true } } },
      });

      if (dbWorkspaces && dbWorkspaces.length > 0) {
        return dbWorkspaces.map((w) => ({
          id: w.id,
          name: w.name,
          slug: w.slug,
          plan: w.plan,
          memberLimit: w.plan === 'PRO' ? 10000 : w.plan === 'ENTERPRISE' ? 100000 : 1000,
          communitiesCount: w._count.communities,
        }));
      }
    } catch {
      // Fallback if DB is offline
    }

    return this.mockWorkspaces;
  }

  async findOne(id: string): Promise<WorkspaceItem> {
    const ws = this.mockWorkspaces.find((w) => w.id === id);
    if (!ws) {
      throw new NotFoundException(`Workspace ${id} not found`);
    }
    return ws;
  }

  async create(data: { name: string; slug: string; plan?: 'FREE' | 'PRO' | 'ENTERPRISE' }): Promise<WorkspaceItem> {
    const created: WorkspaceItem = {
      id: `ws-${Date.now()}`,
      name: data.name,
      slug: data.slug,
      plan: data.plan || 'FREE',
      memberLimit: data.plan === 'PRO' ? 10000 : 1000,
      communitiesCount: 0,
    };
    this.mockWorkspaces.push(created);
    return created;
  }
}
