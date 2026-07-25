import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { CommunityModule } from './community/community.module';
import { BotModule } from './bot/bot.module';
import { ReferralModule } from './referral/referral.module';
import { CampaignModule } from './campaign/campaign.module';
import { RewardModule } from './reward/reward.module';

import { EventModule } from './event/event.module';
import { MeModule } from './me/me.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'apps/api/.env'],
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    WorkspaceModule,
    CommunityModule,
    BotModule,
    ReferralModule,
    CampaignModule,
    RewardModule,
    EventModule,
    MeModule,
    StatsModule,
  ],
})
export class AppModule {}
