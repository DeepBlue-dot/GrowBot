import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventService } from '../event/event.service';
import { BotService } from '../bot/bot.service';

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
  private readonly logger = new Logger(RewardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventService: EventService,
    private readonly botService: BotService,
  ) {}

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

  async findAll(): Promise<RewardItem[]> {
    try {
      const dbRewards = await this.prisma.reward.findMany({
        include: {
          campaign: true,
          user: true,
        },
        orderBy: { earnedAt: 'desc' },
      });

      if (dbRewards && dbRewards.length > 0) {
        return dbRewards.map((r) => ({
          id: r.id,
          campaignId: r.campaignId,
          campaignTitle: r.campaign.title,
          winnerUsername: r.user.username || r.user.firstName,
          winnerTelegramId: String(r.user.telegramId),
          rewardTitle: r.rewardTitle,
          status: r.status,
          createdAt: r.earnedAt.toISOString().split('T')[0],
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Prisma findMany rewards fallback: ${msg}`);
    }

    return this.mockRewards;
  }

  async updateStatus(
    id: string,
    status: RewardItem['status'],
  ): Promise<RewardItem> {
    try {
      const updated = await this.prisma.reward.update({
        where: { id },
        data: {
          status: status,
        },
        include: { campaign: true, user: true },
      });

      if (updated.user?.telegramId) {
        await this.botService.sendRewardNotification(
          updated.user.telegramId,
          updated.rewardTitle,
          status,
        );
      }

      return {
        id: updated.id,
        campaignId: updated.campaignId,
        campaignTitle: updated.campaign.title,
        winnerUsername: updated.user.username || updated.user.firstName,
        winnerTelegramId: String(updated.user.telegramId),
        rewardTitle: updated.rewardTitle,
        status: updated.status,
        createdAt: updated.earnedAt.toISOString().split('T')[0],
      };
    } catch {
      const reward = this.mockRewards.find((r) => r.id === id);
      if (!reward) {
        throw new NotFoundException(`Reward ${id} not found`);
      }
      reward.status = status;
      return reward;
    }
  }

  async checkAndCreateMilestoneReward(
    campaignId: string,
    userId: string,
  ): Promise<RewardItem | null> {
    try {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: campaignId },
      });
      if (!campaign || !campaign.referralTarget) return null;

      const participant = await this.prisma.campaignParticipant.findUnique({
        where: {
          campaignId_userId: { campaignId, userId },
        },
      });

      if (!participant || participant.validatedReferrals < campaign.referralTarget) {
        return null;
      }

      // Check if reward already created for this user on this campaign
      const existingReward = await this.prisma.reward.findFirst({
        where: { campaignId, userId },
        include: { campaign: true, user: true },
      });

      if (existingReward) {
        return {
          id: existingReward.id,
          campaignId: existingReward.campaignId,
          campaignTitle: existingReward.campaign.title,
          winnerUsername: existingReward.user.username || existingReward.user.firstName,
          winnerTelegramId: String(existingReward.user.telegramId),
          rewardTitle: existingReward.rewardTitle,
          status: existingReward.status,
          createdAt: existingReward.earnedAt.toISOString().split('T')[0],
        };
      }

      // Create new reward
      const newReward = await this.prisma.reward.create({
        data: {
          campaignId,
          userId,
          rewardTitle: campaign.rewardDescription || 'Milestone Reward',
          status: 'PENDING',
        },
        include: { campaign: true, user: true },
      });

      // Emit REWARD_EARNED event
      await this.eventService.emitEvent({
        campaignId,
        participantId: participant.id,
        userId,
        eventType: 'REWARD_EARNED',
        metadata: { rewardId: newReward.id, rewardTitle: newReward.rewardTitle },
      });

      this.logger.log(
        `🎁 [Reward Earned] User ${userId} hit target (${campaign.referralTarget}) in campaign ${campaignId}! Reward created: ${newReward.id}`,
      );

      return {
        id: newReward.id,
        campaignId: newReward.campaignId,
        campaignTitle: newReward.campaign.title,
        winnerUsername: newReward.user.username || newReward.user.firstName,
        winnerTelegramId: String(newReward.user.telegramId),
        rewardTitle: newReward.rewardTitle,
        status: newReward.status,
        createdAt: newReward.earnedAt.toISOString().split('T')[0],
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to check/create milestone reward: ${msg}`);
      return null;
    }
  }
}
