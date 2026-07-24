import { PrismaClient, WorkspacePlan, CommunityType, BotStatus, CampaignType, CampaignStatus, ValidationRule, MemberRole, MemberStatus, RewardStatus } from '../src/generated/client/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PostgreSQL database with GrowBot domain data...');

  // 1. Clean existing records (in reverse dependency order)
  await prisma.telegramEventLog.deleteMany();
  await prisma.communityDailyStat.deleteMany();
  await prisma.campaignEvent.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.campaignParticipant.deleteMany();
  await prisma.communityMember.deleteMany();
  await prisma.campaignValidationRule.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.community.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users
  const adminUser = await prisma.user.create({
    data: {
      telegramId: BigInt(100000001),
      username: 'admin_user',
      firstName: 'GrowBot',
      lastName: 'Admin',
      isAdmin: true,
    },
  });

  const alexUser = await prisma.user.create({
    data: {
      telegramId: BigInt(10928374),
      username: 'alex_web3',
      firstName: 'Alex',
      lastName: 'Vance',
      isAdmin: false,
    },
  });

  const sarahUser = await prisma.user.create({
    data: {
      telegramId: BigInt(98712345),
      username: 'sarah_tg',
      firstName: 'Sarah',
      lastName: 'Connor',
      isAdmin: false,
    },
  });

  const davidUser = await prisma.user.create({
    data: {
      telegramId: BigInt(34567890),
      username: 'crypto_ninja',
      firstName: 'David',
      lastName: 'Miller',
      isAdmin: false,
    },
  });

  const elenaUser = await prisma.user.create({
    data: {
      telegramId: BigInt(54321678),
      username: 'elena_v',
      firstName: 'Elena',
      lastName: 'Rostova',
      isAdmin: false,
    },
  });

  const michaelUser = await prisma.user.create({
    data: {
      telegramId: BigInt(87654321),
      username: 'dev_guru',
      firstName: 'Michael',
      lastName: 'Chang',
      isAdmin: false,
    },
  });

  console.log('✅ Created 6 Users');

  // 3. Create Workspaces
  const workspaceCrypto = await prisma.workspace.create({
    data: {
      ownerId: adminUser.id,
      name: 'Crypto Alpha Hub',
      slug: 'crypto-alpha',
      plan: WorkspacePlan.PRO,
      maxCommunities: 10,
      maxCampaigns: 20,
    },
  });

  await prisma.workspace.create({
    data: {
      ownerId: adminUser.id,
      name: 'Web3 Gaming Guild',
      slug: 'web3-gaming',
      plan: WorkspacePlan.FREE,
      maxCommunities: 3,
      maxCampaigns: 5,
    },
  });

  console.log('✅ Created 2 Workspaces');

  // 4. Create Communities
  const communityOfficial = await prisma.community.create({
    data: {
      workspaceId: workspaceCrypto.id,
      telegramChatId: BigInt(-100123456789),
      title: 'GrowBot Official Community',
      username: 'GrowBotOfficial',
      type: CommunityType.SUPERGROUP,
      botStatus: BotStatus.ACTIVE,
      memberCount: 4820,
      inviteLink: 'https://t.me/GrowBotOfficial',
    },
  });

  await prisma.community.create({
    data: {
      workspaceId: workspaceCrypto.id,
      telegramChatId: BigInt(-100987654321),
      title: 'GrowBot Announcements',
      username: 'GrowBotNews',
      type: CommunityType.CHANNEL,
      botStatus: BotStatus.ACTIVE,
      memberCount: 12400,
      inviteLink: 'https://t.me/GrowBotNews',
    },
  });

  console.log('✅ Created 2 Communities');

  // 5. Create Community Members
  const usersList = [alexUser, sarahUser, davidUser, elenaUser, michaelUser];
  for (const user of usersList) {
    await prisma.communityMember.create({
      data: {
        communityId: communityOfficial.id,
        userId: user.id,
        role: MemberRole.MEMBER,
        status: MemberStatus.ACTIVE,
        messageCount: Math.floor(Math.random() * 50) + 5,
      },
    });
  }

  // 6. Create Campaigns & Validation Rules
  const campaignSprint = await prisma.campaign.create({
    data: {
      communityId: communityOfficial.id,
      createdById: adminUser.id,
      title: 'Summer Growth Sprint 🚀',
      description: 'Invite 5 friends to unlock exclusive VIP group access and early feature testing.',
      type: CampaignType.MILESTONE,
      referralTarget: 5,
      rewardDescription: 'Instant Telegram bot verification role upon reaching 5 valid invites.',
      startDate: new Date('2026-07-01T00:00:00Z'),
      endDate: new Date('2026-08-31T23:59:59Z'),
      status: CampaignStatus.ACTIVE,
    },
  });

  await prisma.campaignValidationRule.createMany({
    data: [
      {
        campaignId: campaignSprint.id,
        ruleType: ValidationRule.TIME_BOUND,
        config: { minStayHours: 24 },
        isActive: true,
      },
      {
        campaignId: campaignSprint.id,
        ruleType: ValidationRule.MESSAGE_COUNT,
        config: { minMessages: 3 },
        isActive: true,
      },
    ],
  });

  const campaignContest = await prisma.campaign.create({
    data: {
      communityId: communityOfficial.id,
      createdById: adminUser.id,
      title: 'Monthly Top Inviter Contest 🏆',
      description: 'Compete for the top spot on the monthly referral leaderboard!',
      type: CampaignType.LEADERBOARD,
      referralTarget: 50,
      rewardDescription: 'Top 3 inviters split $500 USDT at the end of the month.',
      startDate: new Date('2026-07-15T00:00:00Z'),
      status: CampaignStatus.ACTIVE,
    },
  });

  await prisma.campaignValidationRule.create({
    data: {
      campaignId: campaignContest.id,
      ruleType: ValidationRule.IMMEDIATE,
      config: {},
      isActive: true,
    },
  });

  console.log('✅ Created 2 Campaigns with Validation Rules');

  // 7. Create Campaign Participants
  await prisma.campaignParticipant.create({
    data: {
      campaignId: campaignContest.id,
      userId: alexUser.id,
      referralCode: 'alex_ref_123',
      totalReferrals: 51,
      validatedReferrals: 48,
    },
  });

  await prisma.campaignParticipant.create({
    data: {
      campaignId: campaignContest.id,
      userId: sarahUser.id,
      referralCode: 'sarah_ref_456',
      totalReferrals: 41,
      validatedReferrals: 36,
    },
  });

  await prisma.campaignParticipant.create({
    data: {
      campaignId: campaignContest.id,
      userId: davidUser.id,
      referralCode: 'david_ref_789',
      totalReferrals: 30,
      validatedReferrals: 29,
    },
  });

  await prisma.campaignParticipant.create({
    data: {
      campaignId: campaignContest.id,
      userId: elenaUser.id,
      referralCode: 'elena_ref_101',
      totalReferrals: 22,
      validatedReferrals: 22,
    },
  });

  await prisma.campaignParticipant.create({
    data: {
      campaignId: campaignContest.id,
      userId: michaelUser.id,
      referralCode: 'michael_ref_202',
      totalReferrals: 20,
      validatedReferrals: 18,
    },
  });

  console.log('✅ Created 5 Campaign Participants');

  // 8. Create Rewards
  await prisma.reward.createMany({
    data: [
      {
        campaignId: campaignSprint.id,
        userId: alexUser.id,
        rewardTitle: 'VIP Badge Pass',
        status: RewardStatus.DELIVERED,
        notes: 'Role assigned automatically in Telegram',
      },
      {
        campaignId: campaignContest.id,
        userId: sarahUser.id,
        rewardTitle: '$100 USDT (2nd Place)',
        status: RewardStatus.PENDING,
        notes: 'Wallet submission verification pending',
      },
      {
        campaignId: campaignSprint.id,
        userId: davidUser.id,
        rewardTitle: 'VIP Badge Pass',
        status: RewardStatus.APPROVED,
        notes: 'Approved for reward delivery',
      },
    ],
  });

  console.log('✅ Created Rewards');

  // 9. Create 7 Days of Community Daily Stats for Analytics Charts
  const now = new Date();
  const statsData = [
    { daysAgo: 6, newJoins: 120, leaves: 14, totalReferrals: 90, validatedReferrals: 85 },
    { daysAgo: 5, newJoins: 145, leaves: 10, totalReferrals: 120, validatedReferrals: 110 },
    { daysAgo: 4, newJoins: 190, leaves: 22, totalReferrals: 155, validatedReferrals: 140 },
    { daysAgo: 3, newJoins: 210, leaves: 18, totalReferrals: 180, validatedReferrals: 165 },
    { daysAgo: 2, newJoins: 175, leaves: 15, totalReferrals: 145, validatedReferrals: 130 },
    { daysAgo: 1, newJoins: 240, leaves: 25, totalReferrals: 210, validatedReferrals: 195 },
    { daysAgo: 0, newJoins: 310, leaves: 19, totalReferrals: 275, validatedReferrals: 250 },
  ];

  for (const s of statsData) {
    const date = new Date(now);
    date.setDate(date.getDate() - s.daysAgo);
    await prisma.communityDailyStat.create({
      data: {
        communityId: communityOfficial.id,
        date: date,
        totalMembers: 4820 - s.daysAgo * 150,
        newJoins: s.newJoins,
        leaves: s.leaves,
        totalReferrals: s.totalReferrals,
        validatedReferrals: s.validatedReferrals,
      },
    });
  }

  console.log('✅ Created 7 days of Community Analytics Daily Stats');
  console.log('🚀 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
