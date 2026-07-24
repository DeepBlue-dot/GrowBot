import axios from 'axios';
import type { Workspace, Community, Campaign, LeaderboardEntry, RewardRecord, CommunityGrowthStat } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('growbot_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mock Fallback Service Data for Scaffolding & Demo
export const mockWorkspaces: Workspace[] = [
  {
    id: 'ws-1',
    name: 'Crypto Alpha Hub',
    slug: 'crypto-alpha',
    plan: 'PRO',
    memberLimit: 10000,
    communitiesCount: 3,
  },
  {
    id: 'ws-2',
    name: 'Web3 Gaming Guild',
    slug: 'web3-gaming',
    plan: 'FREE',
    memberLimit: 1000,
    communitiesCount: 1,
  },
];

export const mockCommunities: Community[] = [
  {
    id: 'comm-1',
    workspaceId: 'ws-1',
    telegramChatId: '-100123456789',
    title: 'GrowBot Official Community',
    username: 'GrowBotOfficial',
    type: 'SUPERGROUP',
    memberCount: 4820,
    botIsAdmin: true,
  },
  {
    id: 'comm-2',
    workspaceId: 'ws-1',
    telegramChatId: '-100987654321',
    title: 'GrowBot Announcements',
    username: 'GrowBotNews',
    type: 'CHANNEL',
    memberCount: 12400,
    botIsAdmin: true,
  },
];

export const mockCampaigns: Campaign[] = [
  {
    id: 'camp-1',
    communityId: 'comm-1',
    title: 'Summer Growth Sprint 🚀',
    description: 'Invite 5 friends to unlock exclusive VIP group access and early feature testing.',
    type: 'MILESTONE',
    targetReferrals: 5,
    rewardTitle: 'VIP Badge + Private Channel Pass',
    rewardDescription: 'Instant Telegram bot verification role upon reaching 5 valid invites.',
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
    description: 'Compete for the top spot on the monthly referral leaderboard!',
    type: 'LEADERBOARD',
    targetReferrals: 50,
    rewardTitle: '$500 USDT Prize Pool',
    rewardDescription: 'Top 3 inviters split $500 USDT at the end of the month.',
    isActive: true,
    startDate: '2026-07-15',
    rules: [
      { id: 'r-3', type: 'IMMEDIATE' },
    ],
    totalParticipants: 189,
    validatedReferrals: 940,
  },
];

export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, participantId: 'p-1', telegramId: '10928374', username: 'alex_web3', firstName: 'Alex', validatedReferrals: 48, pendingReferrals: 3, rewardStatus: 'APPROVED' },
  { rank: 2, participantId: 'p-2', telegramId: '98712345', username: 'sarah_tg', firstName: 'Sarah', validatedReferrals: 36, pendingReferrals: 5, rewardStatus: 'PENDING' },
  { rank: 3, participantId: 'p-3', telegramId: '34567890', username: 'crypto_ninja', firstName: 'David', validatedReferrals: 29, pendingReferrals: 1, rewardStatus: 'PENDING' },
  { rank: 4, participantId: 'p-4', telegramId: '54321678', username: 'elena_v', firstName: 'Elena', validatedReferrals: 22, pendingReferrals: 0 },
  { rank: 5, participantId: 'p-5', telegramId: '87654321', username: 'dev_guru', firstName: 'Michael', validatedReferrals: 18, pendingReferrals: 2 },
];

export const mockRewards: RewardRecord[] = [
  { id: 'rw-1', campaignId: 'camp-1', campaignTitle: 'Summer Growth Sprint 🚀', winnerUsername: 'alex_web3', winnerTelegramId: '10928374', rewardTitle: 'VIP Badge Pass', status: 'DELIVERED', createdAt: '2026-07-20' },
  { id: 'rw-2', campaignId: 'camp-2', campaignTitle: 'Monthly Top Inviter Contest 🏆', winnerUsername: 'sarah_tg', winnerTelegramId: '98712345', rewardTitle: '$100 USDT (2nd Place)', status: 'PENDING', createdAt: '2026-07-23' },
  { id: 'rw-3', campaignId: 'camp-1', campaignTitle: 'Summer Growth Sprint 🚀', winnerUsername: 'crypto_ninja', winnerTelegramId: '34567890', rewardTitle: 'VIP Badge Pass', status: 'APPROVED', createdAt: '2026-07-24' },
];

export const mockGrowthStats: CommunityGrowthStat[] = [
  { date: 'Jul 18', joins: 120, leaves: 14, validReferrals: 85 },
  { date: 'Jul 19', joins: 145, leaves: 10, validReferrals: 110 },
  { date: 'Jul 20', joins: 190, leaves: 22, validReferrals: 140 },
  { date: 'Jul 21', joins: 210, leaves: 18, validReferrals: 165 },
  { date: 'Jul 22', joins: 175, leaves: 15, validReferrals: 130 },
  { date: 'Jul 23', joins: 240, leaves: 25, validReferrals: 195 },
  { date: 'Jul 24', joins: 310, leaves: 19, validReferrals: 250 },
];

export default api;
