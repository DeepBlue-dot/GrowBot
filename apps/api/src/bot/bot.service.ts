import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot, InlineKeyboard } from 'grammy';
import { ReferralService } from '../referral/referral.service';

@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BotService.name);
  private bot: Bot;

  constructor(
    private readonly configService: ConfigService,
    private readonly referralService: ReferralService,
  ) {}

  async onModuleInit() {
    const token =
      this.configService.get<string>('TELEGRAM_BOT_TOKEN') ||
      process.env.TELEGRAM_BOT_TOKEN ||
      '8968966948:AAGXgsBnaMR6XE2rfTZph-uhhrnY7qKTWrQ';

    this.bot = new Bot(token);
    this.setupHandlers();

    const mode =
      this.configService.get<string>('TELEGRAM_BOT_MODE') ||
      process.env.TELEGRAM_BOT_MODE ||
      (process.env.NODE_ENV === 'production' ? 'webhook' : 'polling');

    if (mode === 'polling') {
      this.logger.log(
        `🤖 Starting Telegram Dev Bot in LOCAL DEVELOPMENT MODE (Long Polling)... Token: ${token.substring(0, 10)}...`,
      );
      try {
        await this.bot.api.deleteWebhook({ drop_pending_updates: true });
        
        // Start Long Polling non-blocking runner
        this.bot
          .start({
            drop_pending_updates: true,
            allowed_updates: ['message', 'chat_member', 'my_chat_member', 'callback_query'],
            onStart: (botInfo) => {
              this.logger.log(
                `⚡ Long Polling Bot SUCCESSFULLY ACTIVE: @${botInfo.username} (ID: ${botInfo.id})`,
              );
            },
          })
          .catch((err) => {
            this.logger.error(`❌ Long Polling Runner Error: ${err?.message || err}`);
          });
      } catch (err: any) {
        this.logger.warn(`Failed to connect Long Polling: ${err?.message || err}`);
      }
    } else {
      const webhookUrl = this.configService.get<string>('TELEGRAM_WEBHOOK_URL');
      const secret =
        this.configService.get<string>('TELEGRAM_WEBHOOK_SECRET') || 'growbot_secret_token_123';

      if (webhookUrl) {
        this.logger.log(`🚀 Registering Production Telegram Webhook: ${webhookUrl}`);
        try {
          await this.bot.api.setWebhook(webhookUrl, { secret_token: secret });
        } catch (err: any) {
          this.logger.warn(`Failed to register Webhook URL: ${err?.message || err}`);
        }
      } else {
        this.logger.log('ℹ️ Webhook Mode active. Awaiting HTTP POST /api/telegram/webhook updates.');
      }
    }
  }

  private setupHandlers() {
    if (!this.bot) return;

    // Global Error Handler
    this.bot.catch((err) => {
      const ctx = err.ctx;
      this.logger.error(`[grammY Error] Exception processing update ${ctx.update.update_id}:`, err.error);
    });

    // Command: /start
    this.bot.command('start', async (ctx) => {
      this.logger.log(`📩 Received /start command from user ${ctx.from?.username || ctx.from?.id}`);
      const startParam = ctx.match; // e.g. ref_CODE
      const miniAppUrl =
        this.configService.get<string>('MINI_APP_URL') ||
        'https://grow-hekggrmnr-deepblue-dots-projects.vercel.app/miniapp';

      const keyboard = new InlineKeyboard()
        .webApp('🚀 Open GrowBot Mini App', miniAppUrl)
        .row()
        .url('📢 Join Community', 'https://t.me/GrowBotOfficial');

      let text = `👋 **Welcome to GrowBot!**\n\nGrow your Telegram community with automated referral campaigns, zero rate-limits, and PostgreSQL attribution.`;

      if (startParam) {
        text += `\n\n✨ Inviter Referral Code: \`${startParam}\``;
      }

      await ctx.reply(text, { reply_markup: keyboard, parse_mode: 'Markdown' });
    });

    // Command: /help
    this.bot.command('help', async (ctx) => {
      this.logger.log(`📩 Received /help command from user ${ctx.from?.username || ctx.from?.id}`);
      await ctx.reply(
        `💡 **GrowBot Command Reference:**\n\n` +
          `/start - Open Mini App and get referral link\n` +
          `/stats - View referral invites performance\n` +
          `/help - Display bot usage guide`,
        { parse_mode: 'Markdown' },
      );
    });

    // Command: /stats
    this.bot.command('stats', async (ctx) => {
      this.logger.log(`📩 Received /stats command from user ${ctx.from?.username || ctx.from?.id}`);
      await ctx.reply(
        `📊 **Your Referral Metrics:**\n\n` +
          `• Verified Referrals: **5**\n` +
          `• Pending Intents: **1**\n` +
          `• Unlocked Rewards: **VIP Pass**`,
        { parse_mode: 'Markdown' },
      );
    });

    // Listener: chat_member update
    this.bot.on('chat_member', async (ctx) => {
      await this.handleChatMemberUpdate(ctx.chatMember);
    });
  }

  verifySecretHeader(secretHeader: string): boolean {
    const expectedSecret =
      this.configService.get<string>('TELEGRAM_WEBHOOK_SECRET') || 'growbot_secret_token_123';
    if (!secretHeader && process.env.NODE_ENV !== 'production') {
      return true;
    }
    return secretHeader === expectedSecret;
  }

  async processUpdate(update: any) {
    this.logger.log(`Received Telegram Webhook Update [ID: ${update.update_id}]`);

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

    this.logger.log(
      `[ChatMemberUpdate] User ${user.username || inviteeId} status changed to ${newStatus} in chat ${chatId}`,
    );

    if (newStatus === 'member') {
      // Step 5: Check PostgreSQL intent via ReferralService
      const pendingIntent = await this.referralService.findPendingIntent(inviteeId, chatId);

      if (pendingIntent) {
        this.logger.log(
          `🎯 [PostgreSQL Referral Verified] Invitee ${inviteeId} matched intent from Referrer ${pendingIntent.referrerCode}! Crediting referral...`,
        );
        await this.referralService.markValidated(inviteeId, chatId);
        return {
          status: 'referral_validated',
          inviteeId,
          referrerCode: pendingIntent.referrerCode,
          storage: 'PostgreSQL',
        };
      }
    } else if (newStatus === 'left' || newStatus === 'kicked') {
      // Anti-Cheat Credit Revocation in PostgreSQL
      this.logger.warn(
        `⚠️ [PostgreSQL Anti-Cheat Revocation] Member ${inviteeId} left chat ${chatId}. Revoking unearned referral credit in PostgreSQL...`,
      );
      await this.referralService.markRevoked(inviteeId, chatId);
      return { status: 'referral_revoked', inviteeId, storage: 'PostgreSQL' };
    }

    return { status: 'member_updated', newStatus };
  }

  async onModuleDestroy() {
    if (this.bot) {
      try {
        await this.bot.stop();
      } catch (err) {
        // Ignore stop error on shutdown
      }
    }
  }
}
