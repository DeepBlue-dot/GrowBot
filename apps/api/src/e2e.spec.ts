import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceService } from './workspace/workspace.service';
import { CampaignService } from './campaign/campaign.service';
import { ReferralService } from './referral/referral.service';
import { MeService } from './me/me.service';
import { RewardService } from './reward/reward.service';
import { EventService } from './event/event.service';
import { PrismaService } from './prisma/prisma.service';
import { BotService } from './bot/bot.service';

describe('GrowBot Full E2E Integration Suite', () => {
  let workspaceService: WorkspaceService;
  let campaignService: CampaignService;
  let referralService: ReferralService;
  let meService: MeService;

  beforeEach(async () => {
    const mockPrisma = {
      workspace: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'ws-1', name: 'Crypto Alpha Hub', slug: 'crypto-alpha', plan: 'PRO', _count: { communities: 3 } },
        ]),
        findFirst: jest.fn().mockResolvedValue({ id: 'ws-1', name: 'Crypto Alpha Hub', slug: 'crypto-alpha', plan: 'PRO', _count: { communities: 3 } }),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'ws-test', name: 'Test WS', slug: 'test-ws', plan: 'FREE', _count: { communities: 0 } }),
        update: jest.fn().mockResolvedValue({ id: 'ws-1', name: 'Updated WS', slug: 'crypto-alpha', plan: 'PRO', _count: { communities: 3 } }),
        delete: jest.fn().mockResolvedValue({ id: 'ws-1' }),
      },
      campaign: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue({
          id: 'camp-1',
          title: 'Summer Growth Sprint',
          status: 'ACTIVE',
          referralTarget: 5,
          rewardDescription: 'VIP Pass',
          startDate: new Date(),
          validationRules: [],
          _count: { participants: 0, referrals: 0 },
          community: { telegramChatId: '-100123456789' },
          participants: [],
        }),
        update: jest.fn().mockResolvedValue({ id: 'camp-1', status: 'ACTIVE' }),
      },
      referral: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue({ id: 'user-1', telegramId: BigInt(123456) }),
        upsert: jest.fn().mockResolvedValue({ id: 'user-1', telegramId: BigInt(123456), username: 'alex_web3' }),
      },
      campaignParticipant: {
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn().mockResolvedValue({ id: 'p-1', campaignId: 'camp-1', userId: 'user-1', referralCode: 'ref_alex' }),
      },
    };

    const mockEventService = {
      emitEvent: jest.fn().mockResolvedValue(null),
    };

    const mockBotService = {
      sendCampaignAnnouncement: jest.fn().mockResolvedValue(null),
      sendMilestoneCongrats: jest.fn().mockResolvedValue(null),
      sendRewardNotification: jest.fn().mockResolvedValue(null),
    };

    const mockRewardService = {
      checkAndCreateMilestoneReward: jest.fn().mockResolvedValue(null),
      updateStatus: jest.fn().mockResolvedValue(null),
      findAll: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceService,
        CampaignService,
        ReferralService,
        MeService,
        { provide: RewardService, useValue: mockRewardService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventService, useValue: mockEventService },
        { provide: BotService, useValue: mockBotService },
      ],
    }).compile();

    workspaceService = module.get<WorkspaceService>(WorkspaceService);
    campaignService = module.get<CampaignService>(CampaignService);
    referralService = module.get<ReferralService>(ReferralService);
    meService = module.get<MeService>(MeService);
  });

  describe('1. Owner Workspace & Campaign Management Flow', () => {
    it('should create a workspace with plan limit calculations', async () => {
      const result = await workspaceService.create({
        name: 'Test WS',
        slug: 'test-ws',
        plan: 'FREE',
      });
      expect(result).toBeDefined();
      expect(result.memberLimit).toBe(1000);
    });

    it('should retrieve workspace details', async () => {
      const ws = await workspaceService.findOne('ws-1');
      expect(ws.name).toBe('Crypto Alpha Hub');
    });

    it('should update campaign status and trigger bot announcement', async () => {
      const res = await campaignService.updateStatus('camp-1', 'ACTIVE');
      expect(res).toBeDefined();
    });

    it('should export campaign data to CSV format', async () => {
      const csv = await campaignService.exportCampaignCsv('camp-1');
      expect(csv).toContain('Rank');
    });
  });

  describe('2. Participant & Referral Attribution Flow', () => {
    it('should allow user to opt into a campaign and receive referral link', async () => {
      const res = await campaignService.joinCampaign('camp-1', '123456');
      expect(res.success).toBe(true);
      expect(res.referralCode).toBe('ref_alex');
    });

    it('should fetch participant campaign progress and referral history', async () => {
      const campaigns = await meService.getMyCampaigns('123456');
      expect(campaigns).toBeDefined();

      const referrals = await meService.getMyReferrals('123456');
      expect(referrals).toBeDefined();
    });
  });
});
