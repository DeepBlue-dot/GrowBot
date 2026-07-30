import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MeService {
  private readonly logger = new Logger(MeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMyCampaigns(userIdOrTgId: string) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { id: userIdOrTgId },
            ...(isNaN(Number(userIdOrTgId))
              ? []
              : [{ telegramId: BigInt(userIdOrTgId) }]),
          ],
        },
      });

      if (!user) return [];

      const participations = await this.prisma.campaignParticipant.findMany({
        where: { userId: user.id },
        include: {
          campaign: {
            include: {
              community: true,
            },
          },
        },
      });

      return participations.map((p) => ({
        participantId: p.id,
        campaignId: p.campaignId,
        title: p.campaign.title,
        communityTitle: p.campaign.community.title,
        referralCode: p.referralCode,
        validatedReferrals: p.validatedReferrals,
        totalReferrals: p.totalReferrals,
        targetReferrals: p.campaign.referralTarget || 5,
        rewardTitle: p.campaign.rewardDescription,
        status: p.campaign.status,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to fetch my campaigns: ${msg}`);
      return [];
    }
  }

  async getMyReferrals(userIdOrTgId: string) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { id: userIdOrTgId },
            ...(isNaN(Number(userIdOrTgId))
              ? []
              : [{ telegramId: BigInt(userIdOrTgId) }]),
          ],
        },
      });

      if (!user) return [];

      const referrals = await this.prisma.referral.findMany({
        where: { referrerId: user.id },
        include: {
          invitee: true,
          campaign: true,
        },
        orderBy: { intentAt: 'desc' },
      });

      return referrals.map((r) => ({
        referralId: r.id,
        campaignTitle: r.campaign.title,
        inviteeUsername: r.invitee.username || r.invitee.firstName,
        inviteeTelegramId: String(r.invitee.telegramId),
        status: r.status,
        intentAt: r.intentAt,
        joinedAt: r.joinedAt,
        validatedAt: r.validatedAt,
        revokedAt: r.revokedAt,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to fetch my referrals: ${msg}`);
      return [];
    }
  }
}
