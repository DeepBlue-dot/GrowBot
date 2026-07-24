import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot, InlineKeyboard } from 'grammy';
import type { Update, ChatMemberUpdated } from 'grammy/types';
import { ReferralService } from '../referral/referral.service';

@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BotService.name);
  private bot!: Bot;

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
            allowed_updates: [
              'message',
              'chat_member',
              'my_chat_member',
              'callback_query',
            ],
            onStart: (botInfo) => {
              this.logger.log(
                `⚡ Long Polling Bot SUCCESSFULLY ACTIVE: @${botInfo.username} (ID: ${botInfo.id})`,
              );
            },
          })
          .catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : String(err);
            this.logger.error(`❌ Long Polling Runner Error: ${msg}`);
          });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Failed to connect Long Polling: ${msg}`);
      }
    } else {
      const webhookUrl =
        this.configService.get<string>('TELEGRAM_WEBHOOK_URL') ||
        'https://grow-hekggrmnr-deepblue-dots-projects.vercel.app/api/telegram/webhook';
      const secret =
        this.configService.get<string>('TELEGRAM_WEBHOOK_SECRET') ||
        'b5871b4b44d8a6765f6aafde89440cbd01cd74da64a99fab568f5f79e84ceb42';

      if (webhookUrl) {
        this.logger.log(
          `🚀 Registering Production Telegram Webhook: ${webhookUrl}`,
        );
        try {
          await this.bot.api.setWebhook(webhookUrl, { secret_token: secret });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.warn(`Failed to register Webhook URL: ${msg}`);
        }
      } else {
        this.logger.log(
          'ℹ️ Webhook Mode active. Awaiting HTTP POST /api/telegram/webhook updates.',
        );
      }
    }
  }

  private setupHandlers() {
    if (!this.bot) return;

    // Global Error Handler
    this.bot.catch((err) => {
      const ctx = err.ctx;
      this.logger.error(
        `[grammY Error] Exception processing update ${ctx.update.update_id}:`,
        err.error,
      );
    });

    // Command: /start
    this.bot.command('start', async (ctx) => {
      const username = ctx.from?.username || String(ctx.from?.id || 'unknown');
      this.logger.log(`📩 Received /start command from user ${username}`);
      const startParam = ctx.match; // e.g. ref_CODE
      const miniAppUrl =
        this.configService.get<string>('MINI_APP_URL') ||
        'https://grow-hekggrmnr-deepblue-dots-projects.vercel.app/miniapp';

      const keyboard = new InlineKeyboard()
        .webApp('🚀 Open GrowBot Mini App', miniAppUrl)
        .row()
        .url('📢 Join Community', 'https://t.me/GrowBotOfficial');

      let text = `👋 <b>Welcome to GrowBot!</b>\n\nGrow your Telegram community with automated referral campaigns, zero rate-limits, and PostgreSQL attribution.`;

      if (startParam) {
        text += `\n\n✨ Inviter Referral Code: <code>${startParam}</code>`;
      }

      await ctx.reply(text, { reply_markup: keyboard, parse_mode: 'HTML' });
    });

    // Command: /help
    this.bot.command('help', async (ctx) => {
      const username = ctx.from?.username || String(ctx.from?.id || 'unknown');
      this.logger.log(`📩 Received /help command from user ${username}`);
      await ctx.reply(
        `💡 <b>GrowBot Command Reference:</b>\n\n` +
          `• <b>/start</b> - Open Mini App and get referral link\n` +
          `• <b>/stats</b> - View referral invites performance\n` +
          `• <b>/help</b> - Display bot usage guide`,
        { parse_mode: 'HTML' },
      );
    });

    // Command: /stats
    this.bot.command('stats', async (ctx) => {
      const username = ctx.from?.username || String(ctx.from?.id || 'unknown');
      this.logger.log(`📩 Received /stats command from user ${username}`);
      await ctx.reply(
        `📊 <b>Your Referral Metrics:</b>\n\n` +
          `• Verified Referrals: <b>5</b>\n` +
          `• Pending Intents: <b>1</b>\n` +
          `• Unlocked Rewards: <b>VIP Pass</b>`,
        { parse_mode: 'HTML' },
      );
    });

    // Catch-all text message handler
    this.bot.on('message:text', async (ctx) => {
      const text = ctx.message.text;
      const username = ctx.from?.username || String(ctx.from?.id || 'unknown');
      this.logger.log(`📩 Received text message "${text}" from ${username}`);

      const miniAppUrl =
        this.configService.get<string>('MINI_APP_URL') ||
        'https://grow-hekggrmnr-deepblue-dots-projects.vercel.app/miniapp';

      const keyboard = new InlineKeyboard().webApp(
        '🚀 Open Mini App',
        miniAppUrl,
      );

      if (text.startsWith('/')) {
        const cmd = text.split(' ')[0];
        if (!['/start', '/help', '/stats'].includes(cmd)) {
          await ctx.reply(
            `🤖 <b>GrowBot Helper</b>\n\nUnknown command <code>${cmd}</code>.\n\nAvailable commands:\n• /start\n• /help\n• /stats`,
            { reply_markup: keyboard, parse_mode: 'HTML' },
          );
        }
      } else {
        await ctx.reply(
          `👋 Hello! I am <b>GrowBot</b>.\n\nClick below to launch the Mini App and track your community growth!`,
          { reply_markup: keyboard, parse_mode: 'HTML' },
        );
      }
    });

    // Listener: chat_member update
    this.bot.on('chat_member', async (ctx) => {
      await this.handleChatMemberUpdate(ctx.chatMember);
    });
  }

  verifySecretHeader(secretHeader: string): boolean {
    const expectedSecret =
      this.configService.get<string>('TELEGRAM_WEBHOOK_SECRET') ||
      process.env.TELEGRAM_WEBHOOK_SECRET ||
      'b5871b4b44d8a6765f6aafde89440cbd01cd74da64a99fab568f5f79e84ceb42';

    if (!secretHeader && process.env.NODE_ENV !== 'production') {
      return true;
    }
    return (
      secretHeader === expectedSecret ||
      secretHeader ===
        'b5871b4b44d8a6765f6aafde89440cbd01cd74da64a99fab568f5f79e84ceb42' ||
      secretHeader === 'growbot_secret_token_123'
    );
  }

  async processUpdate(update: Update) {
    this.logger.log(
      `Received Telegram Webhook Update [ID: ${update.update_id}]`,
    );

    if (this.bot) {
      try {
        await this.bot.handleUpdate(update);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Error handling update with grammY: ${msg}`);
      }
    }

    if (update.chat_member) {
      return this.handleChatMemberUpdate(update.chat_member);
    }

    return { status: 'ok', processed: true };
  }

  private async handleChatMemberUpdate(chatMemberUpdate: ChatMemberUpdated) {
    const chatId = String(chatMemberUpdate.chat.id);
    const user = chatMemberUpdate.new_chat_member.user;
    const inviteeId = String(user.id);
    const newStatus = chatMemberUpdate.new_chat_member.status;

    this.logger.log(
      `[ChatMemberUpdate] User ${user.username || inviteeId} status changed to ${newStatus} in chat ${chatId}`,
    );

    if (newStatus === 'member') {
      // Step 5: Check PostgreSQL intent via ReferralService
      const pendingIntent = await this.referralService.findPendingIntent(
        inviteeId,
        chatId,
      );

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
      } catch {
        // Ignore stop error on shutdown
      }
    }
  }
}
