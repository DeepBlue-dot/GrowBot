import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReferralService } from '../referral/referral.service';

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly referralService: ReferralService,
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
      // Step 5: Check PostgreSQL intent via ReferralService
      const pendingIntent = await this.referralService.findPendingIntent(inviteeId, chatId);

      if (pendingIntent) {
        this.logger.log(`🎯 [PostgreSQL Referral Verified] Invitee ${inviteeId} matched intent from Referrer ${pendingIntent.referrerCode}! Crediting referral...`);
        await this.referralService.markValidated(inviteeId, chatId);
        return { 
          status: 'referral_validated', 
          inviteeId, 
          referrerCode: pendingIntent.referrerCode, 
          storage: 'PostgreSQL' 
        };
      }
    } else if (newStatus === 'left' || newStatus === 'kicked') {
      // Anti-Cheat Credit Revocation in PostgreSQL
      this.logger.warn(`⚠️ [PostgreSQL Anti-Cheat Revocation] Member ${inviteeId} left chat ${chatId}. Revoking unearned referral credit in PostgreSQL...`);
      await this.referralService.markRevoked(inviteeId, chatId);
      return { status: 'referral_revoked', inviteeId, storage: 'PostgreSQL' };
    }

    return { status: 'member_updated', newStatus };
  }
}
