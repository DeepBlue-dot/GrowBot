import { Injectable, NotFoundException } from '@nestjs/common';

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

  findAll(): Promise<CampaignItem[]> {
    return Promise.resolve(this.mockCampaigns);
  }

  findOne(id: string): Promise<CampaignItem> {
    const campaign = this.mockCampaigns.find((c) => c.id === id);
    if (!campaign) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }
    return Promise.resolve(campaign);
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

  getLeaderboard(campaignId?: string): Promise<typeof this.mockLeaderboard> {
    if (campaignId) {
      // Optional campaign parameter filter
    }
    return Promise.resolve(this.mockLeaderboard);
  }
}
