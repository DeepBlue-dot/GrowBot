import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignRuleInput,
} from './dto/campaign.dto.js';

export { CreateCampaignDto, UpdateCampaignDto, CampaignRuleInput };

@Injectable()
export class CampaignService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(communityId?: string) {
    const dbCampaigns = await this.prisma.campaign.findMany({
      where: communityId ? { communityId } : undefined,
      include: {
        validationRules: true,
        _count: {
          select: {
            participants: true,
            referrals: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return dbCampaigns.map((c) => ({
      id: c.id,
      communityId: c.communityId,
      createdById: c.createdById,
      title: c.title,
      description: c.description || '',
      type: c.type,
      targetReferrals: c.referralTarget || 5,
      rewardTitle: c.rewardDescription || 'Campaign Reward',
      rewardDescription: c.rewardDescription,
      isActive: c.status === 'ACTIVE',
      status: c.status,
      startDate: c.startDate.toISOString().split('T')[0],
      endDate: c.endDate ? c.endDate.toISOString().split('T')[0] : undefined,
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

  async findOne(id: string) {
    const c = await this.prisma.campaign.findUnique({
      where: { id },
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

    if (!c) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }

    return {
      id: c.id,
      communityId: c.communityId,
      createdById: c.createdById,
      title: c.title,
      description: c.description || '',
      type: c.type,
      targetReferrals: c.referralTarget || 5,
      rewardTitle: c.rewardDescription || 'Campaign Reward',
      rewardDescription: c.rewardDescription,
      isActive: c.status === 'ACTIVE',
      status: c.status,
      startDate: c.startDate.toISOString().split('T')[0],
      endDate: c.endDate ? c.endDate.toISOString().split('T')[0] : undefined,
      rules: c.validationRules.map((r) => ({
        id: r.id,
        type: r.ruleType,
        minStayHours: (r.config as { minStayHours?: number })?.minStayHours,
        minMessages: (r.config as { minMessages?: number })?.minMessages,
      })),
      totalParticipants: c._count.participants,
      validatedReferrals: c._count.referrals,
    };
  }

  async create(data: CreateCampaignDto, userId?: string) {
    let creatorId = userId || data.createdById;

    if (!creatorId) {
      const firstUser = await this.prisma.user.findFirst();
      if (!firstUser) {
        const defaultUser = await this.prisma.user.create({
          data: {
            telegramId: BigInt(Date.now()),
            firstName: 'Default Admin',
            isAdmin: true,
          },
        });
        creatorId = defaultUser.id;
      } else {
        creatorId = firstUser.id;
      }
    }

    let targetCommunityId = data.communityId;
    const existingCommunity = await this.prisma.community.findFirst({
      where: { OR: [{ id: targetCommunityId }, { title: targetCommunityId }] },
    });

    if (existingCommunity) {
      targetCommunityId = existingCommunity.id;
    } else {
      const firstCommunity = await this.prisma.community.findFirst();
      if (firstCommunity) {
        targetCommunityId = firstCommunity.id;
      } else {
        throw new BadRequestException('No community found to attach campaign');
      }
    }

    const campaign = await this.prisma.campaign.create({
      data: {
        communityId: targetCommunityId,
        createdById: creatorId,
        title: data.title,
        description: data.description || '',
        type: data.type || 'MILESTONE',
        referralTarget: data.targetReferrals || 5,
        rewardDescription:
          data.rewardTitle || data.rewardDescription || 'VIP Pass',
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: 'ACTIVE',
        validationRules: {
          create: (data.rules && data.rules.length > 0
            ? data.rules
            : [{ type: 'IMMEDIATE' }]
          ).map((r) => ({
            ruleType: r.type,
            config: {
              ...(r.minStayHours ? { minStayHours: r.minStayHours } : {}),
              ...(r.minMessages ? { minMessages: r.minMessages } : {}),
            },
          })),
        },
      },
      include: {
        validationRules: true,
      },
    });

    return this.findOne(campaign.id);
  }

  async update(id: string, data: UpdateCampaignDto) {
    const existing = await this.prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }

    await this.prisma.campaign.update({
      where: { id },
      data: {
        title: data.title ?? undefined,
        description: data.description ?? undefined,
        type: data.type ?? undefined,
        referralTarget: data.targetReferrals ?? undefined,
        rewardDescription: data.rewardDescription ?? undefined,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        status: data.status ?? undefined,
      },
    });

    if (data.rules && data.rules.length > 0) {
      await this.prisma.campaignValidationRule.deleteMany({
        where: { campaignId: id },
      });
      await this.prisma.campaignValidationRule.createMany({
        data: data.rules.map((r) => ({
          campaignId: id,
          ruleType: r.type,
          config: {
            ...(r.minStayHours ? { minStayHours: r.minStayHours } : {}),
            ...(r.minMessages ? { minMessages: r.minMessages } : {}),
          },
        })),
      });
    }

    return this.findOne(id);
  }

  async updateStatus(
    id: string,
    status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED',
  ) {
    const existing = await this.prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }

    await this.prisma.campaign.update({
      where: { id },
      data: { status },
    });

    return this.findOne(id);
  }

  async remove(id: string) {
    const existing = await this.prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }

    await this.prisma.campaign.delete({ where: { id } });
    return { success: true, id };
  }

  async joinCampaign(campaignId: string, userTgIdOrId?: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) {
      throw new NotFoundException(`Campaign ${campaignId} not found`);
    }

    const tgId =
      userTgIdOrId && !isNaN(Number(userTgIdOrId))
        ? BigInt(userTgIdOrId)
        : BigInt(987654321);

    const user = await this.prisma.user.upsert({
      where: { telegramId: tgId },
      update: {},
      create: {
        telegramId: tgId,
        firstName: `User_${tgId.toString()}`,
      },
    });

    const referralCode = `ref_${user.username || user.telegramId.toString()}_${campaignId.substring(0, 6)}`;

    const participant = await this.prisma.campaignParticipant.upsert({
      where: {
        campaignId_userId: {
          campaignId: campaign.id,
          userId: user.id,
        },
      },
      update: {},
      create: {
        campaignId: campaign.id,
        userId: user.id,
        referralCode,
      },
    });

    return {
      success: true,
      participantId: participant.id,
      campaignId: campaign.id,
      referralCode: participant.referralCode,
      referralLink: `https://t.me/GrowBotApp/app?startapp=${participant.referralCode}`,
    };
  }

  async getLeaderboard(campaignId?: string) {
    const participants = await this.prisma.campaignParticipant.findMany({
      where: campaignId ? { campaignId } : undefined,
      orderBy: { validatedReferrals: 'desc' },
      take: 50,
      include: {
        user: true,
      },
    });

    return participants.map((p, index) => ({
      rank: index + 1,
      participantId: p.id,
      telegramId: String(p.user.telegramId),
      username: p.user.username || 'anonymous',
      firstName: p.user.firstName,
      validatedReferrals: p.validatedReferrals,
      pendingReferrals: Math.max(0, p.totalReferrals - p.validatedReferrals),
    }));
  }
}
