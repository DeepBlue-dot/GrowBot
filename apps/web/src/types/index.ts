export type WorkspacePlan = 'FREE' | 'PRO' | 'ENTERPRISE';

export type CampaignType = 'MILESTONE' | 'LEADERBOARD';

export type ValidationRuleType = 'IMMEDIATE' | 'TIME_BOUND' | 'MESSAGE_COUNT';

export type ReferralStatus = 'PENDING_JOIN' | 'VALIDATED' | 'REVOKED';

export type RewardStatus = 'PENDING' | 'APPROVED' | 'DELIVERED' | 'REJECTED';

export interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: WorkspacePlan;
  memberLimit: number;
  communitiesCount: number;
}

export interface Community {
  id: string;
  workspaceId: string;
  telegramChatId: string;
  title: string;
  username?: string;
  type: 'GROUP' | 'SUPERGROUP' | 'CHANNEL';
  memberCount: number;
  botIsAdmin: boolean;
}

export interface ValidationRule {
  id: string;
  type: ValidationRuleType;
  minStayHours?: number;
  minMessages?: number;
}

export interface Campaign {
  id: string;
  communityId: string;
  title: string;
  description: string;
  type: CampaignType;
  targetReferrals: number;
  rewardTitle: string;
  rewardDescription?: string;
  isActive: boolean;
  startDate: string;
  endDate?: string;
  rules: ValidationRule[];
  totalParticipants: number;
  validatedReferrals: number;
}

export interface LeaderboardEntry {
  rank: number;
  participantId: string;
  telegramId: string;
  username?: string;
  firstName: string;
  photoUrl?: string;
  validatedReferrals: number;
  pendingReferrals: number;
  rewardStatus?: RewardStatus;
}

export interface RewardRecord {
  id: string;
  campaignId: string;
  campaignTitle: string;
  winnerUsername: string;
  winnerTelegramId: string;
  rewardTitle: string;
  status: RewardStatus;
  createdAt: string;
}

export interface CommunityGrowthStat {
  date: string;
  joins: number;
  leaves: number;
  validReferrals: number;
}
