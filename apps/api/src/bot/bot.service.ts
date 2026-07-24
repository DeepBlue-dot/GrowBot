import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  verifySecretHeader(secretHeader: string): boolean {
    const expectedSecret = this.configService.get<string>('TELEGRAM_WEBHOOK_SECRET') || 'growbot_secret_token_123';
    if (!secretHeader && process.env.NODE_ENV !== 'production') {
      return true;
    }
    return secretHeader === expectedSecret;
  }

  async processUpdate(update: any) {
    this.logger.log(`Received Telegram Update [ID: ${update.update_id}]`);

    // Handle chat_member updates (member joins/leaves)
    if (update.chat_member) {
      return this.handleChatMemberUpdate(update.chat_member);
    }

    return { status: 'ok', processed: true };
  }

  private async handleChatMemberUpdate(chatMemberUpdate: any) {
    const chatId = String(chatMemberUpdate.chat.id);
    const user = chatMemberUpdate.new_chat_member.user;
    const inviteeId = String(user.id);
    const newStatus = chatMemberUpdate.new_chat_member.status;

    this.logger.log(`[ChatMemberUpdate] User ${user.username || inviteeId} status changed to ${newStatus} in chat ${chatId}`);

    if (newStatus === 'member') {
      // Step 5: Check Redis intent
      const redisKey = `pending_ref:${inviteeId}:${chatId}`;
      const referrerId = await this.redisService.getKey(redisKey);

      if (referrerId) {
        this.logger.log(`🎯 [Referral Verified] Invitee ${inviteeId} matched intent from Referrer ${referrerId}! Crediting referral...`);
        await this.redisService.deleteKey(redisKey);
        return { status: 'referral_validated', inviteeId, referrerId };
      }
    } else if (newStatus === 'left' || newStatus === 'kicked') {
      // Anti-Cheat Credit Revocation
      this.logger.warn(`⚠️ [Anti-Cheat Revocation] Member ${inviteeId} left chat ${chatId}. Revoking unearned referral credit...`);
      return { status: 'referral_revoked', inviteeId };
    }

    return { status: 'member_updated', newStatus };
  }
}
