import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventService } from '../event/event.service';
import { RewardService } from '../reward/reward.service';
import { BotService } from '../bot/bot.service';

export interface PostgresReferralIntent {
  id: string;
  referrerCode: string;
  inviteeId: string;
  communityChatId: string;
  status: 'PENDING_JOIN' | 'VALIDATED' | 'REVOKED';
  intentAt: Date;
}

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);
  private memoryIntents = new Map<string, PostgresReferralIntent>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventService: EventService,
    private readonly rewardService: RewardService,
    @Inject(forwardRef(() => BotService))
    private readonly botService: BotService,
  ) {}

  async registerIntent(
    referrerCode: string,
    inviteeId: string,
    communityChatId: string,
  ) {
    const intentKey = `${inviteeId}:${communityChatId}`;
    const intentData: PostgresReferralIntent = {
      id: `ref-${Date.now()}`,
      referrerCode,
      inviteeId,
      communityChatId,
      status: 'PENDING_JOIN',
      intentAt: new Date(),
    };

    try {
      const parsedChatId = BigInt(communityChatId);
      const parsedInviteeTgId = BigInt(inviteeId);

      // 1. Find community
      const community = await this.prisma.community.findUnique({
        where: { telegramChatId: parsedChatId },
        include: { campaigns: { where: { status: 'ACTIVE' } } },
      });

      // 2. Find active campaign or fallback to latest campaign
      let campaignId: string | null = null;
      if (community && community.campaigns.length > 0) {
        campaignId = community.campaigns[0].id;
      } else {
        const anyCampaign = await this.prisma.campaign.findFirst({
          orderBy: { createdAt: 'desc' },
        });
        if (anyCampaign) campaignId = anyCampaign.id;
      }

      if (campaignId) {
        // 3. Upsert invitee User
        const inviteeUser = await this.prisma.user.upsert({
          where: { telegramId: parsedInviteeTgId },
          update: {},
          create: {
            telegramId: parsedInviteeTgId,
            firstName: `Invitee_${inviteeId}`,
          },
        });

        // 4. Resolve Referrer User & Participant
        let referrerUser = await this.prisma.user.findFirst({
          where: {
            OR: [
              { username: referrerCode },
              ...(isNaN(Number(referrerCode))
                ? []
                : [{ telegramId: BigInt(referrerCode) }]),
            ],
          },
        });

        // Check if referrerCode belongs to a CampaignParticipant
        if (!referrerUser) {
          const participant = await this.prisma.campaignParticipant.findUnique(
            {
              where: { referralCode: referrerCode },
              include: { user: true },
            },
          );
          if (participant) {
            referrerUser = participant.user;
          }
        }

        // If referrer user still not found, create placeholder user
        if (!referrerUser) {
          const tgId = !isNaN(Number(referrerCode))
            ? BigInt(referrerCode)
            : BigInt(Math.floor(Math.random() * 1000000000));
          referrerUser = await this.prisma.user.create({
            data: {
              telegramId: tgId,
              username: isNaN(Number(referrerCode)) ? referrerCode : null,
              firstName: referrerCode,
            },
          });
        }

        // Upsert CampaignParticipant for referrer
        const participant = await this.prisma.campaignParticipant.upsert({
          where: {
            campaignId_userId: {
              campaignId,
              userId: referrerUser.id,
            },
          },
          update: {
            totalReferrals: { increment: 1 },
          },
          create: {
            campaignId,
            userId: referrerUser.id,
            referralCode: referrerCode,
            totalReferrals: 1,
          },
        });

        // 5. Upsert Referral record in DB
        const referral = await this.prisma.referral.upsert({
          where: {
            campaignId_inviteeId: {
              campaignId,
              inviteeId: inviteeUser.id,
            },
          },
          update: {
            status: 'PENDING_JOIN',
            referrerId: referrerUser.id,
            intentAt: intentData.intentAt,
          },
          create: {
            campaignId,
            referrerId: referrerUser.id,
            inviteeId: inviteeUser.id,
            status: 'PENDING_JOIN',
            intentAt: intentData.intentAt,
          },
        });

        // 6. Sourcing CampaignEvent
        await this.eventService.emitEvent({
          campaignId,
          participantId: participant.id,
          userId: inviteeUser.id,
          referralId: referral.id,
          eventType: 'INTENT_CREATED',
          metadata: { referrerCode, communityChatId },
        });

        intentData.id = referral.id;
        this.logger.log(
          `🐘 [PostgreSQL Intent Saved] Invitee ${inviteeId} -> Referrer ${referrerCode} (Referral ID: ${referral.id}, Status: PENDING_JOIN)`,
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed DB write for registerIntent, falling back: ${msg}`);
      this.memoryIntents.set(intentKey, intentData);
    }

    this.memoryIntents.set(intentKey, intentData);

    return {
      success: true,
      storage: 'PostgreSQL',
      inviteeId,
      communityChatId,
      referrerCode,
      status: 'PENDING_JOIN',
      intentAt: intentData.intentAt,
    };
  }

  async findPendingIntent(
    inviteeId: string,
    communityChatId: string,
  ): Promise<PostgresReferralIntent | null> {
    const intentKey = `${inviteeId}:${communityChatId}`;

    try {
      const parsedChatId = BigInt(communityChatId);
      const parsedInviteeTgId = BigInt(inviteeId);

      const inviteeUser = await this.prisma.user.findUnique({
        where: { telegramId: parsedInviteeTgId },
      });

      const community = await this.prisma.community.findUnique({
        where: { telegramChatId: parsedChatId },
      });

      if (inviteeUser && community) {
        const referral = await this.prisma.referral.findFirst({
          where: {
            inviteeId: inviteeUser.id,
            campaign: { communityId: community.id },
            status: { in: ['PENDING_JOIN', 'PENDING_VALIDATION'] },
          },
          include: { referrer: true },
        });

        if (referral) {
          return {
            id: referral.id,
            referrerCode: referral.referrer.username || referral.referrer.id,
            inviteeId,
            communityChatId,
            status: 'PENDING_JOIN',
            intentAt: referral.intentAt,
          };
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Prisma findPendingIntent fallback: ${msg}`);
    }

    const intent = this.memoryIntents.get(intentKey);
    if (intent && intent.status === 'PENDING_JOIN') {
      return intent;
    }
    return null;
  }

  async markValidated(inviteeId: string, communityChatId: string): Promise<void> {
    const intentKey = `${inviteeId}:${communityChatId}`;
    const intent = this.memoryIntents.get(intentKey);
    if (intent) {
      intent.status = 'VALIDATED';
    }

    try {
      const parsedChatId = BigInt(communityChatId);
      const parsedInviteeTgId = BigInt(inviteeId);

      const inviteeUser = await this.prisma.user.findUnique({
        where: { telegramId: parsedInviteeTgId },
      });

      const community = await this.prisma.community.findUnique({
        where: { telegramChatId: parsedChatId },
      });

      if (inviteeUser && community) {
        const referral = await this.prisma.referral.findFirst({
          where: {
            inviteeId: inviteeUser.id,
            campaign: { communityId: community.id },
            status: { in: ['PENDING_JOIN', 'PENDING_VALIDATION'] },
          },
        });

        if (referral) {
          const now = new Date();
          const updatedReferral = await this.prisma.referral.update({
            where: { id: referral.id },
            data: {
              status: 'VALIDATED',
              joinedAt: now,
              validatedAt: now,
            },
          });

          // Increment participant validated referrals
          const participant = await this.prisma.campaignParticipant.findUnique({
            where: {
              campaignId_userId: {
                campaignId: referral.campaignId,
                userId: referral.referrerId,
              },
            },
          });

          if (participant) {
            await this.prisma.campaignParticipant.update({
              where: { id: participant.id },
              data: {
                validatedReferrals: { increment: 1 },
              },
            });
          }

          // Emit CampaignEvent
          await this.eventService.emitEvent({
            campaignId: referral.campaignId,
            participantId: participant?.id,
            userId: inviteeUser.id,
            referralId: updatedReferral.id,
            eventType: 'REFERRAL_VALIDATED',
            metadata: { inviteeId, communityChatId },
          });

          // Check if referrer hit milestone target for reward auto-creation
          await this.rewardService.checkAndCreateMilestoneReward(
            referral.campaignId,
            referral.referrerId,
          );

          // Dispatch Group Welcome Attribution Notification & Participant DM Update
          const referrerUser = await this.prisma.user.findUnique({ where: { id: referral.referrerId } });
          const inviteeUsername = inviteeUser.username || inviteeUser.firstName || inviteeId;
          const referrerUsername = referrerUser?.username || referrerUser?.firstName || 'Referrer';
          
          await this.botService.sendGroupWelcomeAttribution(
            communityChatId,
            inviteeUsername,
            referrerUsername,
          );

          if (referrerUser?.telegramId) {
            const updatedParticipant = await this.prisma.campaignParticipant.findUnique({
              where: {
                campaignId_userId: {
                  campaignId: referral.campaignId,
                  userId: referral.referrerId,
                },
              },
              include: { campaign: true },
            });

            await this.botService.sendParticipantAttributionDM(
              referrerUser.telegramId,
              inviteeUsername,
              updatedParticipant?.validatedReferrals || 1,
              updatedParticipant?.campaign.referralTarget || 5,
              updatedParticipant?.campaign.rewardDescription || 'VIP Pass',
            );
          }

          this.logger.log(
            `🐘 [PostgreSQL Referral Validated] Referral ${referral.id} set to VALIDATED for invitee ${inviteeId}`,
          );
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed DB write for markValidated: ${msg}`);
    }
  }

  async markRevoked(inviteeId: string, communityChatId: string): Promise<void> {
    const intentKey = `${inviteeId}:${communityChatId}`;
    const intent = this.memoryIntents.get(intentKey);
    if (intent) {
      intent.status = 'REVOKED';
    }

    try {
      const parsedChatId = BigInt(communityChatId);
      const parsedInviteeTgId = BigInt(inviteeId);

      const inviteeUser = await this.prisma.user.findUnique({
        where: { telegramId: parsedInviteeTgId },
      });

      const community = await this.prisma.community.findUnique({
        where: { telegramChatId: parsedChatId },
      });

      if (inviteeUser && community) {
        const referral = await this.prisma.referral.findFirst({
          where: {
            inviteeId: inviteeUser.id,
            campaign: { communityId: community.id },
            status: { in: ['VALIDATED', 'PENDING_JOIN', 'PENDING_VALIDATION'] },
          },
        });

        if (referral) {
          const wasValidated = referral.status === 'VALIDATED';
          const updatedReferral = await this.prisma.referral.update({
            where: { id: referral.id },
            data: {
              status: 'REVOKED',
              revokedAt: new Date(),
            },
          });

          const participant = await this.prisma.campaignParticipant.findUnique({
            where: {
              campaignId_userId: {
                campaignId: referral.campaignId,
                userId: referral.referrerId,
              },
            },
          });

          if (wasValidated && participant && participant.validatedReferrals > 0) {
            await this.prisma.campaignParticipant.update({
              where: { id: participant.id },
              data: {
                validatedReferrals: { decrement: 1 },
              },
            });
          }

          // Emit CampaignEvent
          await this.eventService.emitEvent({
            campaignId: referral.campaignId,
            participantId: participant?.id,
            userId: inviteeUser.id,
            referralId: updatedReferral.id,
            eventType: 'REFERRAL_REVOKED',
            metadata: { inviteeId, communityChatId },
          });

          this.logger.log(
            `🐘 [PostgreSQL Referral Revoked] Referral ${referral.id} set to REVOKED for invitee ${inviteeId}`,
          );
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed DB write for markRevoked: ${msg}`);
    }
  }
}
