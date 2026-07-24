import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  constructor(private readonly redisService: RedisService) {}

  async registerIntent(referrerCode: string, inviteeId: string, communityChatId: string) {
    const redisKey = `pending_ref:${inviteeId}:${communityChatId}`;
    await this.redisService.setKey(redisKey, referrerCode, 86400); // 24 hours TTL

    this.logger.log(`⚡ [Redis Intent Created] Key: ${redisKey} -> Referrer: ${referrerCode}`);

    return {
      success: true,
      inviteeId,
      communityChatId,
      referrerCode,
      ttl: 86400,
    };
  }
}
