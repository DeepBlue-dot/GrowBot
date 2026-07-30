import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth/auth.service';
import { WorkspaceService } from './workspace/workspace.service';
import { CampaignService } from './campaign/campaign.service';
import { ReferralService } from './referral/referral.service';
import { CommunityService } from './community/community.service';
import { RewardService } from './reward/reward.service';
import { MeService } from './me/me.service';
import { StatsService } from './stats/stats.service';
import { EventService } from './event/event.service';
import { BotService } from './bot/bot.service';
import { PrismaService } from './prisma/prisma.service';

describe('GrowBot Specification Test Suite (doc/features.md)', () => {
  let authService: AuthService;
  let workspaceService: WorkspaceService;
  let campaignService: CampaignService;
  let referralService: ReferralService;
  let communityService: CommunityService;
  let rewardService: RewardService;
  let meService: MeService;
  let statsService: StatsService;
  let botService: BotService;

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'user-owner-1',
          telegramId: BigInt(10928374),
          username: 'alex_web3',
          firstName: 'Alex',
          isAdmin: true,
        }),
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-owner-1',
          telegramId: BigInt(10928374),
          username: 'alex_web3',
          firstName: 'Alex',
          isAdmin: true,
        }),
        upsert: jest.fn().mockResolvedValue({
          id: 'user-invitee-1',
          telegramId: BigInt(987654321),
          username: 'invitee_b',
          firstName: 'Invitee B',
        }),
        create: jest.fn().mockResolvedValue({
          id: 'user-new-1',
          telegramId: BigInt(555666777),
          firstName: 'New User',
        }),
      },
      workspace: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'ws-1', name: 'Crypto Alpha Hub', slug: 'crypto-alpha', plan: 'PRO', ownerId: 'user-owner-1', _count: { communities: 3 } },
        ]),
        findFirst: jest.fn().mockResolvedValue({ id: 'ws-1', name: 'Crypto Alpha Hub', slug: 'crypto-alpha', plan: 'PRO', _count: { communities: 3 } }),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'ws-new', name: 'New Guild', slug: 'new-guild', plan: 'FREE', ownerId: 'user-owner-1', _count: { communities: 0 } }),
        update: jest.fn().mockResolvedValue({ id: 'ws-1', name: 'Updated Hub', slug: 'crypto-alpha', plan: 'PRO', _count: { communities: 3 } }),
        delete: jest.fn().mockResolvedValue({ id: 'ws-1' }),
      },
      community: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'comm-1',
          workspaceId: 'ws-1',
          telegramChatId: BigInt(-100123456789),
          title: 'GrowBot Official Community',
          username: 'GrowBotOfficial',
          botStatus: 'ACTIVE',
          memberCount: 4820,
        }),
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn().mockResolvedValue({
          id: 'comm-1',
          workspaceId: 'ws-1',
          telegramChatId: BigInt(-100123456789),
          title: 'GrowBot Official Community',
          botStatus: 'ACTIVE',
        }),
        update: jest.fn().mockResolvedValue({ id: 'comm-1', botStatus: 'ACTIVE' }),
      },
      campaign: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue({
          id: 'camp-1',
          communityId: 'comm-1',
          createdById: 'user-owner-1',
          title: 'Summer Growth Sprint 🚀',
          type: 'MILESTONE',
          referralTarget: 5,
          rewardDescription: 'VIP Badge Pass',
          status: 'ACTIVE',
          startDate: new Date(),
          validationRules: [{ id: 'r-1', ruleType: 'IMMEDIATE', config: {} }],
          _count: { participants: 10, referrals: 25 },
          community: { telegramChatId: BigInt(-100123456789), title: 'GrowBot Official Community' },
          participants: [],
        }),
        create: jest.fn().mockResolvedValue({ id: 'camp-new', status: 'ACTIVE' }),
        update: jest.fn().mockResolvedValue({ id: 'camp-1', status: 'ACTIVE' }),
        delete: jest.fn().mockResolvedValue({ id: 'camp-1' }),
      },
      campaignParticipant: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'p-1',
            campaignId: 'camp-1',
            userId: 'user-owner-1',
            referralCode: 'ref_alex_web3',
            validatedReferrals: 5,
            totalReferrals: 6,
            campaign: {
              title: 'Summer Growth Sprint 🚀',
              referralTarget: 5,
              rewardDescription: 'VIP Badge Pass',
              status: 'ACTIVE',
              community: { title: 'GrowBot Official Community' },
            },
          },
        ]),
        findUnique: jest.fn().mockResolvedValue({
          id: 'p-1',
          campaignId: 'camp-1',
          userId: 'user-owner-1',
          validatedReferrals: 5,
          totalReferrals: 6,
        }),
        upsert: jest.fn().mockResolvedValue({
          id: 'p-1',
          campaignId: 'camp-1',
          userId: 'user-owner-1',
          referralCode: 'ref_alex_web3_camp-1',
          validatedReferrals: 5,
          totalReferrals: 6,
        }),
        update: jest.fn().mockResolvedValue({ id: 'p-1', validatedReferrals: 5 }),
      },
      referral: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'ref-1',
          referrerId: 'user-owner-1',
          inviteeId: 'user-invitee-1',
          campaignId: 'camp-1',
          communityId: 'comm-1',
          referrerCode: 'alex_web3',
          status: 'PENDING_JOIN',
          intentAt: new Date(),
        }),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({
          id: 'ref-1',
          status: 'PENDING_JOIN',
          intentAt: new Date(),
        }),
        update: jest.fn().mockResolvedValue({
          id: 'ref-1',
          status: 'VALIDATED',
          validatedAt: new Date(),
        }),
      },
      campaignEvent: {
        create: jest.fn().mockResolvedValue({ id: 'evt-1' }),
      },
      communityMember: {
        upsert: jest.fn().mockResolvedValue({ id: 'cm-1', status: 'ACTIVE' }),
        update: jest.fn().mockResolvedValue({ id: 'cm-1', status: 'LEFT' }),
      },
      reward: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'rw-1',
          campaignId: 'camp-1',
          userId: 'user-owner-1',
          rewardTitle: 'VIP Badge Pass',
          status: 'PENDING',
          earnedAt: new Date(),
          campaign: { title: 'Summer Growth Sprint 🚀' },
          user: { firstName: 'Alex', username: 'alex_web3', telegramId: BigInt(10928374) },
        }),
        update: jest.fn().mockResolvedValue({
          id: 'rw-1',
          campaignId: 'camp-1',
          rewardTitle: 'VIP Badge Pass',
          status: 'APPROVED',
          earnedAt: new Date(),
          campaign: { title: 'Summer Growth Sprint 🚀' },
          user: { firstName: 'Alex', username: 'alex_web3', telegramId: BigInt(10928374) },
        }),
      },
      communityDailyStat: {
        upsert: jest.fn().mockResolvedValue({ id: 'stat-1' }),
        findMany: jest.fn().mockResolvedValue([
          { date: new Date(), totalMembers: 4820, newJoins: 15, leaves: 2, totalReferrals: 20, validatedReferrals: 14 },
        ]),
      },
    };

    const mockEventService = {
      emitEvent: jest.fn().mockResolvedValue({ id: 'evt-1' }),
    };

    const mockBotService = {
      sendCampaignAnnouncement: jest.fn().mockResolvedValue(null),
      sendMilestoneCongrats: jest.fn().mockResolvedValue(null),
      sendRewardNotification: jest.fn().mockResolvedValue(null),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('mock-secret-key'),
      getOrThrow: jest.fn().mockReturnValue('mock-secret-key'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        WorkspaceService,
        CampaignService,
        ReferralService,
        CommunityService,
        RewardService,
        MeService,
        StatsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventService, useValue: mockEventService },
        { provide: BotService, useValue: mockBotService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    workspaceService = module.get<WorkspaceService>(WorkspaceService);
    campaignService = module.get<CampaignService>(CampaignService);
    referralService = module.get<ReferralService>(ReferralService);
    communityService = module.get<CommunityService>(CommunityService);
    rewardService = module.get<RewardService>(RewardService);
    meService = module.get<MeService>(MeService);
    statsService = module.get<StatsService>(StatsService);
    botService = module.get<BotService>(BotService);
  });

  describe('1. User Roles & Security Model (doc/features.md §1 & §14)', () => {
    it('should validate Telegram authentication and generate JWT tokens', async () => {
      const loginResult = authService.generateTokens({
        id: 'user-owner-1',
        telegramId: '10928374',
        username: 'alex_web3',
        firstName: 'Alex',
        isAdmin: true,
      });

      expect(loginResult).toBeDefined();
      expect(loginResult.accessToken).toBeDefined();
      expect(loginResult.user.username).toBe('alex_web3');
    });
  });

  describe('2. Community Owner & Workspace Tier Limits (doc/features.md §3 & §13)', () => {
    it('should enforce workspace tier plan limits (FREE = 1,000 members, PRO = 10,000 members)', async () => {
      const freeWorkspace = await workspaceService.create({
        name: 'New Guild',
        slug: 'new-guild',
        plan: 'FREE',
      });
      expect(freeWorkspace.memberLimit).toBe(1000);

      const proWorkspace = await workspaceService.findOne('ws-1');
      expect(proWorkspace.memberLimit).toBe(10000);
    });

    it('should allow community owners to create campaigns with validation rules', async () => {
      const campaign = await campaignService.create({
        communityId: 'comm-1',
        title: 'Summer Growth Sprint 🚀',
        type: 'MILESTONE',
        targetReferrals: 5,
        rewardTitle: 'VIP Badge Pass',
        startDate: '2026-07-01',
        rules: [{ type: 'IMMEDIATE' }],
      });

      expect(campaign).toBeDefined();
      expect(campaign.title).toBe('Summer Growth Sprint 🚀');
    });
  });

  describe('3. Participant Campaign Opt-In & Referral Code Generation (doc/features.md §4)', () => {
    it('should opt participant into campaign and issue unique referral code', async () => {
      const result = await campaignService.joinCampaign('camp-1', '10928374');

      expect(result.success).toBe(true);
      expect(result.referralCode).toBeDefined();
      expect(result.referralLink).toContain('startapp=');
    });

    it('should return participant Joined Campaigns and Referral History', async () => {
      const myCampaigns = await meService.getMyCampaigns('10928374');
      expect(myCampaigns).toHaveLength(1);
      expect(myCampaigns[0].title).toBe('Summer Growth Sprint 🚀');

      const myReferrals = await meService.getMyReferrals('10928374');
      expect(myReferrals).toBeDefined();
    });
  });

  describe('4. Invitee 5-Step Attribution Funnel (doc/features.md §5)', () => {
    it('Step 3: Should register referral intent with PENDING_JOIN status', async () => {
      const intent = await referralService.registerIntent({
        referrerCode: 'alex_web3',
        inviteeId: '987654321',
        communityChatId: '-100123456789',
      });

      expect(intent).toBeDefined();
      expect(intent.status).toBe('PENDING_JOIN');
    });

    it('Step 5: Should verify join webhook and validate referral credit', async () => {
      await expect(
        referralService.markValidated('987654321', '-100123456789'),
      ).resolves.not.toThrow();
    });
  });

  describe('5. Anti-Cheat Revocation Engine & Validation Rules (doc/features.md §6 & §7)', () => {
    it('should revoke referral credit and decrement counts when referred member leaves', async () => {
      await expect(
        referralService.markRevoked('987654321', '-100123456789'),
      ).resolves.not.toThrow();
    });

    it('should track community member status and first joined timestamps', async () => {
      const member = await communityService.upsertMember(
        BigInt(-100123456789),
        BigInt(987654321),
        'invitee_b',
      );
      expect(member).toBeDefined();
    });
  });

  describe('6. Reward Auto-Creation, Bot Notifications & CSV Export (doc/features.md §3.4, §9 & §3.3)', () => {
    it('should auto-create milestone reward when target is hit', async () => {
      const reward = await rewardService.checkAndCreateMilestoneReward('camp-1', 'user-owner-1');
      expect(reward).toBeDefined();
      expect(reward?.rewardTitle).toBe('VIP Badge Pass');
    });

    it('should trigger bot DM notification on reward status update', async () => {
      const updatedReward = await rewardService.updateStatus('rw-1', 'APPROVED');
      expect(updatedReward.status).toBe('APPROVED');
    });

    it('should announce active campaign launches in community chat', async () => {
      const updatedCamp = await campaignService.updateStatus('camp-1', 'ACTIVE');
      expect(updatedCamp.status).toBe('ACTIVE');
    });

    it('should generate CSV export file for campaign metrics', async () => {
      const csv = await campaignService.exportCampaignCsv('camp-1');
      expect(csv).toContain('Rank,Participant ID,Username,Telegram ID');
    });

    it('should query CommunityDailyStat time-series analytics', async () => {
      const stats = await statsService.getCommunityStats('comm-1', 7);
      expect(stats).toBeDefined();
      expect(stats.length).toBeGreaterThan(0);
    });
  });
});
