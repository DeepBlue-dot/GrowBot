import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BotService } from './bot.service';
import { ReferralService } from '../referral/referral.service';
import { CommunityService } from '../community/community.service';
import { StatsService } from '../stats/stats.service';
import { MeService } from '../me/me.service';

describe('BotService Unit Tests', () => {
  let botService: BotService;

  beforeEach(async () => {
    const mockReferralService = {
      findPendingIntent: jest.fn().mockResolvedValue(null),
      markValidated: jest.fn().mockResolvedValue(null),
      markRevoked: jest.fn().mockResolvedValue(null),
    };

    const mockCommunityService = {
      upsertFromTelegram: jest.fn().mockResolvedValue({ id: 'comm-1', title: 'Test Group' }),
      updateBotStatus: jest.fn().mockResolvedValue({ id: 'comm-1' }),
      upsertMember: jest.fn().mockResolvedValue({ id: 'cm-1' }),
      updateMemberStatus: jest.fn().mockResolvedValue({ id: 'cm-1' }),
    };

    const mockStatsService = {
      recordMetric: jest.fn().mockResolvedValue(null),
    };

    const mockMeService = {
      getMyReferrals: jest.fn().mockResolvedValue([
        { id: 'ref-1', status: 'VALIDATED' },
        { id: 'ref-2', status: 'PENDING_JOIN' },
      ]),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('mock-bot-token-12345'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BotService,
        { provide: ReferralService, useValue: mockReferralService },
        { provide: CommunityService, useValue: mockCommunityService },
        { provide: StatsService, useValue: mockStatsService },
        { provide: MeService, useValue: mockMeService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    botService = module.get<BotService>(BotService);
  });

  describe('Bot Command Registration & Updates', () => {
    it('should initialize BotService and offer verifySecretHeader', () => {
      expect(botService).toBeDefined();
      expect(botService.verifySecretHeader('mock-secret')).toBe(false);
    });

    it('should process webhook updates gracefully', async () => {
      const res = await botService.processUpdate({
        update_id: 100,
        message: { text: '/start' },
      });
      expect(res).toBeDefined();
    });

    it('should handle bot promotion update (my_chat_member)', async () => {
      const res = await botService.processUpdate({
        update_id: 101,
        my_chat_member: {
          chat: { id: -10012345, title: 'Alpha Group', type: 'supergroup' },
          from: { id: 999, username: 'admin_owner' },
          new_chat_member: {
            status: 'administrator',
            user: { id: 777, is_bot: true },
          },
        },
      });
      expect(res).toBeDefined();
    });

    it('should handle user join update (chat_member)', async () => {
      const res = await botService.processUpdate({
        update_id: 102,
        chat_member: {
          chat: { id: -10012345, title: 'Alpha Group', type: 'supergroup' },
          from: { id: 888, username: 'new_member' },
          new_chat_member: {
            status: 'member',
            user: { id: 888, username: 'new_member', is_bot: false },
          },
        },
      });
      expect(res).toBeDefined();
    });
  });
});
