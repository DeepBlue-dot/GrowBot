import { Injectable, NotFoundException } from '@nestjs/common';

export interface RewardItem {
  id: string;
  campaignId: string;
  campaignTitle: string;
  winnerUsername: string;
  winnerTelegramId: string;
  rewardTitle: string;
  status: 'PENDING' | 'APPROVED' | 'DELIVERED' | 'REJECTED';
  createdAt: string;
}

@Injectable()
export class RewardService {
  private mockRewards: RewardItem[] = [
    {
      id: 'rw-1',
      campaignId: 'camp-1',
      campaignTitle: 'Summer Growth Sprint 🚀',
      winnerUsername: 'alex_web3',
      winnerTelegramId: '10928374',
      rewardTitle: 'VIP Badge Pass',
      status: 'DELIVERED',
      createdAt: '2026-07-20',
    },
    {
      id: 'rw-2',
      campaignId: 'camp-2',
      campaignTitle: 'Monthly Top Inviter Contest 🏆',
      winnerUsername: 'sarah_tg',
      winnerTelegramId: '98712345',
      rewardTitle: '$100 USDT (2nd Place)',
      status: 'PENDING',
      createdAt: '2026-07-23',
    },
    {
      id: 'rw-3',
      campaignId: 'camp-1',
      campaignTitle: 'Summer Growth Sprint 🚀',
      winnerUsername: 'crypto_ninja',
      winnerTelegramId: '34567890',
      rewardTitle: 'VIP Badge Pass',
      status: 'APPROVED',
      createdAt: '2026-07-24',
    },
  ];

  findAll(): Promise<RewardItem[]> {
    return Promise.resolve(this.mockRewards);
  }

  updateStatus(id: string, status: RewardItem['status']): Promise<RewardItem> {
    const reward = this.mockRewards.find((r) => r.id === id);
    if (!reward) {
      throw new NotFoundException(`Reward ${id} not found`);
    }
    reward.status = status;
    return Promise.resolve(reward);
  }
}
