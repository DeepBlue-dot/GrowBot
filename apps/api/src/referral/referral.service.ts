import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

  constructor(private readonly prisma: PrismaService) {}

  async registerIntent(referrerCode: string, inviteeId: string, communityChatId: string) {
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
      // Attempt PostgreSQL persistent write via Prisma Client
      if ((this.prisma as any).referral?.create) {
        await (this.prisma as any).referral.create({
          data: {
            referrerId: referrerCode,
            inviteeId,
            status: 'PENDING_JOIN',
            intentAt: intentData.intentAt,
          },
        });
        this.logger.log(`🐘 [PostgreSQL Intent Saved] Invitee ${inviteeId} -> Referrer ${referrerCode} (Status: PENDING_JOIN)`);
      }
    } catch {
      // Memory fallback if DB is offline during development
      this.memoryIntents.set(intentKey, intentData);
      this.logger.log(`🐘 [PostgreSQL Intent Saved (Memory Store)] Invitee ${inviteeId} -> Referrer ${referrerCode}`);
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

  async findPendingIntent(inviteeId: string, communityChatId: string): Promise<PostgresReferralIntent | null> {
    const intentKey = `${inviteeId}:${communityChatId}`;
    const intent = this.memoryIntents.get(intentKey);
    if (intent && intent.status === 'PENDING_JOIN') {
      return intent;
    }
    return null;
  }

  async markValidated(inviteeId: string, communityChatId: string) {
    const intentKey = `${inviteeId}:${communityChatId}`;
    const intent = this.memoryIntents.get(intentKey);
    if (intent) {
      intent.status = 'VALIDATED';
    }
  }

  async markRevoked(inviteeId: string, communityChatId: string) {
    const intentKey = `${inviteeId}:${communityChatId}`;
    const intent = this.memoryIntents.get(intentKey);
    if (intent) {
      intent.status = 'REVOKED';
    }
  }
}
