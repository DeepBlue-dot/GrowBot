import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CampaignRule {
  id: string;
  type: string;
  minStayHours?: number;
  minMessages?: number;
}

export interface CampaignItem {
  id: string;
  communityId: string;
  title: string;
  description: string;
  type: 'MILESTONE' | 'LEADERBOARD';
  targetReferrals: number;
  rewardTitle: string;
  rewardDescription?: string;
  isActive: boolean;
  startDate: string;
  endDate?: string;
  rules: CampaignRule[];
  totalParticipants: number;
  validatedReferrals: number;
}

@Injectable()
export class CampaignService {
  constructor(private readonly prisma: PrismaService) {}

  private mockCampaigns: CampaignItem[] = [
    {
      id: 'camp-1',
      communityId: 'comm-1',
      title: 'Summer Growth Sprint 🚀',
      description:
        'Invite 5 friends to unlock exclusive VIP group access and early feature testing.',
      type: 'MILESTONE',
      targetReferrals: 5,
      rewardTitle: 'VIP Badge + Private Channel Pass',
      rewardDescription:
        'Instant Telegram bot verification role upon reaching 5 valid invites.',
      isActive: true,
      startDate: '2026-07-01',
      endDate: '2026-08-31',
      rules: [
        { id: 'r-1', type: 'TIME_BOUND', minStayHours: 24 },
        { id: 'r-2', type: 'MESSAGE_COUNT', minMessages: 3 },
      ],
      totalParticipants: 342,
      validatedReferrals: 1280,
    },
    {
      id: 'camp-2',
      communityId: 'comm-1',
      title: 'Monthly Top Inviter Contest 🏆',
      description:
        'Compete for the top spot on the monthly referral leaderboard!',
      type: 'LEADERBOARD',
      targetReferrals: 50,
      rewardTitle: '$500 USDT Prize Pool',
      rewardDescription:
        'Top 3 inviters split $500 USDT at the end of the month.',
      isActive: true,
      startDate: '2026-07-15',
      rules: [{ id: 'r-3', type: 'IMMEDIATE' }],
      totalParticipants: 189,
      validatedReferrals: 940,
    },
  ];

  private mockLeaderboard = [
    {
      rank: 1,
      participantId: 'p-1',
      telegramId: '10928374',
      username: 'alex_web3',
      firstName: 'Alex',
      validatedReferrals: 48,
      pendingReferrals: 3,
      rewardStatus: 'APPROVED',
    },
    {
      rank: 2,
      participantId: 'p-2',
      telegramId: '98712345',
      username: 'sarah_tg',
      firstName: 'Sarah',
      validatedReferrals: 36,
      pendingReferrals: 5,
      rewardStatus: 'PENDING',
    },
    {
      rank: 3,
      participantId: 'p-3',
      telegramId: '34567890',
      username: 'crypto_ninja',
      firstName: 'David',
      validatedReferrals: 29,
      pendingReferrals: 1,
      rewardStatus: 'PENDING',
    },
    {
      rank: 4,
      participantId: 'p-4',
      telegramId: '54321678',
      username: 'elena_v',
      firstName: 'Elena',
      validatedReferrals: 22,
      pendingReferrals: 0,
    },
    {
      rank: 5,
      participantId: 'p-5',
      telegramId: '87654321',
      username: 'dev_guru',
      firstName: 'Michael',
      validatedReferrals: 18,
      pendingReferrals: 2,
    },
  ];

  async findAll(): Promise<CampaignItem[]> {
    try {
      const dbCampaigns = await this.prisma.campaign.findMany({
        include: {
          validationRules: true,
          _count: {
            select: {
              participants: true,
              referrals: true,
            },
          },
        },
      });

      if (dbCampaigns && dbCampaigns.length > 0) {
        return dbCampaigns.map((c) => ({
          id: c.id,
          communityId: c.communityId,
          title: c.title,
          description: c.description || '',
          type: c.type,
          targetReferrals: c.referralTarget || 5,
          rewardTitle: c.rewardDescription || 'Campaign Reward',
          rewardDescription: c.rewardDescription,
          isActive: c.status === 'ACTIVE',
          startDate: c.startDate.toISOString().split('T')[0],
          endDate: c.endDate
            ? c.endDate.toISOString().split('T')[0]
            : undefined,
          rules: c.validationRules.map((r) => ({
            id: r.id,
            type: r.ruleType,
            minStayHours: (r.config as { minStayHours?: number })?.minStayHours,
            minMessages: (r.config as { minMessages?: number })?.minMessages,
          })),
          totalParticipants: c._count.participants,
          validatedReferrals: c._count.referrals,
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Prisma findMany campaigns fallback: ${msg}`);
    }

    return this.mockCampaigns;
  }

  async findOne(id: string): Promise<CampaignItem> {
    const campaigns = await this.findAll();
    const campaign = campaigns.find((c) => c.id === id);
    if (!campaign) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }
    return campaign;
  }

  create(data: Partial<CampaignItem>): Promise<CampaignItem> {
    const created: CampaignItem = {
      id: `camp-${Date.now()}`,
      communityId: data.communityId || 'comm-1',
      title: data.title || 'New Growth Campaign',
      description: data.description || '',
      type: data.type || 'MILESTONE',
      targetReferrals: data.targetReferrals || 5,
      rewardTitle: data.rewardTitle || 'VIP Pass',
      rewardDescription: data.rewardDescription,
      isActive: true,
      startDate: new Date().toISOString().split('T')[0] ?? '2026-07-24',
      rules: data.rules || [
        { id: `r-${Date.now()}`, type: 'TIME_BOUND', minStayHours: 24 },
      ],
      totalParticipants: 0,
      validatedReferrals: 0,
    };
    this.mockCampaigns.unshift(created);
    return Promise.resolve(created);
  }

  async getLeaderboard(campaignId?: string) {
    try {
      const participants = await this.prisma.campaignParticipant.findMany({
        where: campaignId ? { campaignId } : undefined,
        orderBy: { validatedReferrals: 'desc' },
        take: 20,
        include: {
          user: true,
        },
      });

      if (participants && participants.length > 0) {
        return participants.map((p, index) => ({
          rank: index + 1,
          participantId: p.id,
          telegramId: String(p.user.telegramId),
          username: p.user.username || 'anonymous',
          firstName: p.user.firstName,
          validatedReferrals: p.validatedReferrals,
          pendingReferrals: p.totalReferrals - p.validatedReferrals,
          rewardStatus:
            index === 0 ? 'APPROVED' : index === 1 ? 'PENDING' : undefined,
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Prisma findMany leaderboard fallback: ${msg}`);
    }

    return this.mockLeaderboard;
  }
}
