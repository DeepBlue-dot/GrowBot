import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import * as fs from 'fs';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { CommunityModule } from './community/community.module';
import { BotModule } from './bot/bot.module';
import { ReferralModule } from './referral/referral.module';
import { CampaignModule } from './campaign/campaign.module';
import { RewardModule } from './reward/reward.module';

const webDistPath = join(process.cwd(), 'apps/web/dist');
const hasWebDist = fs.existsSync(webDistPath);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'apps/api/.env'],
    }),
    ...(hasWebDist
      ? [
          ServeStaticModule.forRoot({
            rootPath: webDistPath,
            exclude: ['/api/(.*)'],
          }),
        ]
      : []),
    PrismaModule,
    RedisModule,
    AuthModule,
    WorkspaceModule,
    CommunityModule,
    BotModule,
    ReferralModule,
    CampaignModule,
    RewardModule,
  ],
})
export class AppModule {}
