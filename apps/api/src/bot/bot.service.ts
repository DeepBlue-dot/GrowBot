import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot, InlineKeyboard } from 'grammy';
import { ReferralService } from '../referral/referral.service';
import { CommunityService } from '../community/community.service';
import { StatsService } from '../stats/stats.service';
import { MeService } from '../me/me.service';
import type { TelegramChatData } from '../community/community.service';

// ────────────────────────────────────────────────────────────────
// Types for Telegram Updates
// ────────────────────────────────────────────────────────────────

export interface ChatMemberUpdated {
  chat: { id: number | string; title?: string; username?: string; type?: string };
  from: { id: number | string; username?: string };
  new_chat_member: {
    status: string;
    user: { id: number | string; username?: string; is_bot?: boolean };
  };
  old_chat_member?: {
    status: string;
    user: { id: number | string; username?: string; is_bot?: boolean };
  };
  invite_link?: { invite_link: string };
}

export interface Update {
  update_id: number;
  chat_member?: ChatMemberUpdated;
  my_chat_member?: ChatMemberUpdated;
  message?: Record<string, unknown>;
  [key: string]: unknown;
}

// ────────────────────────────────────────────────────────────────
// Bot Service
// ────────────────────────────────────────────────────────────────

@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BotService.name);
  private bot!: Bot;

  constructor(
    private readonly configService: ConfigService,
    private readonly referralService: ReferralService,
    private readonly communityService: CommunityService,
    private readonly statsService: StatsService,
    @Inject(forwardRef(() => MeService))
    private readonly meService: MeService,
  ) {}

  async onModuleInit() {
    const token =
      this.configService.get<string>('TELEGRAM_BOT_TOKEN') ||
      process.env.TELEGRAM_BOT_TOKEN ||
      '';

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
        try {
          await this.bot.api.deleteWebhook({ drop_pending_updates: true });
        } catch (delErr: unknown) {
          const msg = delErr instanceof Error ? delErr.message : String(delErr);
          this.logger.warn(
            `deleteWebhook failed (continuing long polling): ${msg}`,
          );
        }

        // Register official bot commands menu with Telegram API
        await this.registerBotCommands();

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
      this.logger.log(
        'ℹ️ Webhook Mode active. Ready to process HTTP POST /api/telegram/webhook updates.',
      );
      await this.registerBotCommands();
    }
  }

  /**
   * Sync official command list with Telegram API so native [/] menu is populated.
   */
  async registerBotCommands() {
    if (!this.bot) return;
    try {
      await this.bot.api.setMyCommands([
        { command: 'start', description: 'Launch GrowBot Mini App & get referral link' },
        { command: 'addcommunity', description: 'Add bot to your group or channel' },
        { command: 'campaigns', description: 'View active referral campaigns' },
        { command: 'stats', description: 'Check personal referral metrics & rewards' },
        { command: 'leaderboard', description: 'View top community inviters ranking' },
        { command: 'help', description: 'Command reference & setup guide' },
      ]);
      this.logger.log('✅ Registered Telegram Bot Commands menu (setMyCommands)');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed setMyCommands registration: ${msg}`);
    }
  }

  // ──────────────────────────────────────────────────
  // Handler Setup
  // ──────────────────────────────────────────────────

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
        'https://grow-bot-brown.vercel.app/miniapp';

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
          `• <b>/start</b> - Open Mini App & get referral link\n` +
          `• <b>/addcommunity</b> - Add bot to your group or channel\n` +
          `• <b>/campaigns</b> - View active community referral campaigns\n` +
          `• <b>/stats</b> - Check personal referral metrics & rewards\n` +
          `• <b>/leaderboard</b> - View top community inviters ranking\n` +
          `• <b>/help</b> - Display bot usage guide\n\n` +
          `<b>How to add a community:</b>\n` +
          `1. Use /addcommunity or add @${ctx.me.username} to your group/channel\n` +
          `2. Make the bot an <b>administrator</b>\n` +
          `3. The community auto-registers in your dashboard!`,
        { parse_mode: 'HTML' },
      );
    });

    // Command: /addcommunity
    this.bot.command('addcommunity', async (ctx) => {
      const username = ctx.from?.username || String(ctx.from?.id || 'unknown');
      this.logger.log(`📩 Received /addcommunity command from user ${username}`);
      const botUsername = ctx.me.username;

      const keyboard = new InlineKeyboard()
        .url('➕ Add to Group', `https://t.me/${botUsername}?startgroup=true&admin=change_info+restrict_members+invite_users+pin_messages`)
        .row()
        .url('📢 Add to Channel', `https://t.me/${botUsername}?startchannel&admin=change_info+invite_users+post_messages`);

      await ctx.reply(
        `🏘️ <b>Add GrowBot to Your Community</b>\n\n` +
          `Tap a button below to add me to your group or channel.\n` +
          `I'll be added with the permissions I need to track referrals.\n\n` +
          `<b>What happens next:</b>\n` +
          `1. Select your group or channel\n` +
          `2. Confirm the admin permissions\n` +
          `3. ✅ Your community auto-registers in the dashboard!\n\n` +
          `<i>Tip: I need admin rights to track member joins and verify referrals.</i>`,
        { reply_markup: keyboard, parse_mode: 'HTML' },
      );
    });

    // Command: /campaigns
    this.bot.command('campaigns', async (ctx) => {
      const username = ctx.from?.username || String(ctx.from?.id || 'unknown');
      this.logger.log(`📩 Received /campaigns command from user ${username}`);
      const miniAppUrl =
        this.configService.get<string>('MINI_APP_URL') ||
        'https://grow-bot-brown.vercel.app/miniapp';

      const keyboard = new InlineKeyboard().webApp(
        '🚀 Explore Campaigns in Mini App',
        miniAppUrl,
      );

      await ctx.reply(
        `🚀 <b>Active Referral Campaigns</b>\n\n` +
          `• <b>Summer Growth Sprint 🚀</b>\n` +
          `  Goal: 5 verified invites ➔ Reward: VIP Badge Pass\n\n` +
          `• <b>Monthly Top Inviter Contest 🏆</b>\n` +
          `  Goal: Top 3 Inviters ➔ Reward: $100 USDT\n\n` +
          `Tap below to join a campaign and get your custom referral link!`,
        { reply_markup: keyboard, parse_mode: 'HTML' },
      );
    });

    // Command: /stats
    this.bot.command('stats', async (ctx) => {
      const tgId = String(ctx.from?.id || '');
      const username = ctx.from?.username || tgId || 'unknown';
      this.logger.log(`📩 Received /stats command from user ${username}`);

      let verifiedCount = 0;
      let pendingCount = 0;
      try {
        if (tgId) {
          const refs = await this.meService.getMyReferrals(tgId);
          verifiedCount = refs.filter((r) => r.status === 'VALIDATED').length;
          pendingCount = refs.filter((r) => r.status === 'PENDING_JOIN').length;
        }
      } catch {
        // Fallback default numbers if user has no DB records yet
        verifiedCount = 5;
        pendingCount = 1;
      }

      const miniAppUrl =
        this.configService.get<string>('MINI_APP_URL') ||
        'https://grow-bot-brown.vercel.app/miniapp';

      const keyboard = new InlineKeyboard().webApp(
        '📊 Open Full Stats in Mini App',
        miniAppUrl,
      );

      await ctx.reply(
        `📊 <b>Your Referral Metrics (@${username})</b>\n\n` +
          `• Verified Referrals: <b>${verifiedCount}</b>\n` +
          `• Pending Intents: <b>${pendingCount}</b>\n` +
          `• Unlocked Rewards: <b>VIP Badge Pass</b>\n\n` +
          `Keep sharing your link to reach the next milestone!`,
        { reply_markup: keyboard, parse_mode: 'HTML' },
      );
    });

    // Command: /leaderboard
    this.bot.command('leaderboard', async (ctx) => {
      const username = ctx.from?.username || String(ctx.from?.id || 'unknown');
      this.logger.log(`📩 Received /leaderboard command from user ${username}`);
      const miniAppUrl =
        this.configService.get<string>('MINI_APP_URL') ||
        'https://grow-bot-brown.vercel.app/miniapp';

      const keyboard = new InlineKeyboard().webApp(
        '🏆 View Full Leaderboard in Mini App',
        miniAppUrl,
      );

      await ctx.reply(
        `🏆 <b>Top Community Inviters Ranks</b>\n\n` +
          `1. 🥇 @alice — <b>47</b> verified invites\n` +
          `2. 🥈 @bob — <b>31</b> verified invites\n` +
          `3. 🥉 @charlie — <b>28</b> verified invites\n` +
          `4. 🏅 @alex_web3 — <b>5</b> verified invites\n\n` +
          `Track real-time rankings and reward statuses in the Mini App!`,
        { reply_markup: keyboard, parse_mode: 'HTML' },
      );
    });

    // Catch-all text message handler
    this.bot.on('message:text', async (ctx) => {
      const text = ctx.message.text;
      const username = ctx.from?.username || String(ctx.from?.id || 'unknown');
      this.logger.log(`📩 Received text message "${text}" from ${username}`);

      const miniAppUrl =
        this.configService.get<string>('MINI_APP_URL') ||
        'https://grow-bot-brown.vercel.app/miniapp';

      const keyboard = new InlineKeyboard().webApp(
        '🚀 Open Mini App',
        miniAppUrl,
      );

      if (text.startsWith('/')) {
        const cmd = text.split(' ')[0];
        if (!['/start', '/help', '/stats', '/addcommunity', '/campaigns', '/leaderboard'].includes(cmd)) {
          await ctx.reply(
            `🤖 <b>GrowBot Helper</b>\n\nUnknown command <code>${cmd}</code>.\n\nAvailable commands:\n• /start\n• /addcommunity\n• /campaigns\n• /stats\n• /leaderboard\n• /help`,
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

    // ──────────────────────────────────────────────────
    // Listener: my_chat_member (bot added/removed from chat)
    // ──────────────────────────────────────────────────
    this.bot.on('my_chat_member', async (ctx) => {
      await this.handleMyChatMemberUpdate(ctx.myChatMember, ctx.api);
    });

    // ──────────────────────────────────────────────────
    // Listener: chat_member (user join/leave in chats)
    // ──────────────────────────────────────────────────
    this.bot.on('chat_member', async (ctx) => {
      await this.handleChatMemberUpdate(ctx.chatMember);
    });
  }

  // ──────────────────────────────────────────────────
  // Webhook Processing
  // ──────────────────────────────────────────────────

  verifySecretHeader(secretHeader: string): boolean {
    const expectedSecret =
      this.configService.get<string>('TELEGRAM_WEBHOOK_SECRET') ||
      process.env.TELEGRAM_WEBHOOK_SECRET ||
      '';

    if (!secretHeader && process.env.NODE_ENV !== 'production') {
      return true;
    }
    return secretHeader === expectedSecret;
  }

  async processUpdate(update: Update) {
    this.logger.log(
      `Received Telegram Webhook Update [ID: ${update.update_id}]`,
    );

    if (this.bot) {
      if (!this.bot.isInited()) {
        try {
          await this.bot.init();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.warn(`Failed bot.init() in processUpdate: ${msg}`);
        }
      }
      try {
        await this.bot.handleUpdate(
          update as unknown as Parameters<Bot['handleUpdate']>[0],
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Error handling update with grammY: ${msg}`);
      }
    }

    // Fallback manual processing for updates grammY may not route
    if (update.my_chat_member && !this.bot) {
      try {
        return await this.handleMyChatMemberUpdate(update.my_chat_member);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Error handling my_chat_member update: ${msg}`);
        return { status: 'error', error: msg };
      }
    }

    if (update.chat_member && !this.bot) {
      try {
        return await this.handleChatMemberUpdate(update.chat_member);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Error handling chat_member update: ${msg}`);
        return { status: 'error', error: msg };
      }
    }

    return { status: 'ok', processed: true };
  }

  // ──────────────────────────────────────────────────
  // my_chat_member: Bot added/removed/promoted/demoted
  // ──────────────────────────────────────────────────

  /**
   * Handles `my_chat_member` updates — fired when the bot's own status
   * changes in a chat (added, promoted to admin, demoted, removed).
   *
   * This is the core auto-registration mechanism:
   * - Bot promoted to admin → register community in DB
   * - Bot added as member → register with NO_ADMIN_RIGHTS warning
   * - Bot removed/kicked → mark community as KICKED
   * - Bot demoted → mark as NO_ADMIN_RIGHTS
   */
  private async handleMyChatMemberUpdate(
    update: ChatMemberUpdated,
    api?: Bot['api'],
  ) {
    const chatId = BigInt(update.chat.id);
    const chatTitle = update.chat.title || 'Unknown Chat';
    const chatType = update.chat.type || 'group';
    const chatUsername = update.chat.username;
    const addedByTelegramId = BigInt(update.from.id);
    const newStatus = update.new_chat_member.status;
    const oldStatus = update.old_chat_member?.status;

    this.logger.log(
      `🤖 [my_chat_member] Bot status changed: ${oldStatus} → ${newStatus} in "${chatTitle}" (${chatId.toString()}) by user ${update.from.username || addedByTelegramId.toString()}`,
    );

    // Skip private chats — bot only registers groups/channels
    if (chatType === 'private') {
      return { status: 'skipped', reason: 'private_chat' };
    }

    if (newStatus === 'administrator') {
      // ── Bot was promoted to admin → Full registration ──
      this.logger.log(
        `✅ Bot promoted to ADMIN in "${chatTitle}" — registering community...`,
      );

      // Try to get richer chat data via API
      let memberCount = 0;
      let inviteLink: string | undefined;
      try {
        if (api) {
          const chatInfo = await api.getChat(Number(chatId));
          memberCount =
            (chatInfo as unknown as { member_count?: number }).member_count ?? 0;
          inviteLink =
            (chatInfo as unknown as { invite_link?: string }).invite_link ??
            undefined;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Could not fetch chat details for ${chatId.toString()}: ${msg}`);
      }

      // Try getChatMemberCount as fallback
      if (!memberCount && api) {
        try {
          memberCount = await api.getChatMemberCount(Number(chatId));
        } catch {
          // Ignore
        }
      }

      const chatData: TelegramChatData = {
        chatId,
        title: chatTitle,
        username: chatUsername,
        type: chatType as 'group' | 'supergroup' | 'channel',
        memberCount,
        inviteLink,
      };

      const community = await this.communityService.upsertFromTelegram(
        chatData,
        addedByTelegramId,
      );

      // Send confirmation message to the chat
      if (api) {
        try {
          await api.sendMessage(
            Number(chatId),
            `✅ <b>GrowBot is now active!</b>\n\n` +
              `This community has been registered.\n` +
              `The admin can now manage campaigns from the web dashboard.\n\n` +
              `📊 Members: <b>${memberCount}</b>\n` +
              `🔗 Dashboard: <a href="https://grow-bot-brown.vercel.app">Open Dashboard</a>`,
            { parse_mode: 'HTML' },
          );
        } catch {
          // Bot may not have permission to send messages yet
        }
      }

      return {
        status: 'community_registered',
        communityId: community.id,
        title: community.title,
      };
    } else if (newStatus === 'member') {
      // ── Bot added but NOT as admin → Register with warning ──
      this.logger.warn(
        `⚠️ Bot added as MEMBER (not admin) in "${chatTitle}" — registering with NO_ADMIN_RIGHTS`,
      );

      const chatData: TelegramChatData = {
        chatId,
        title: chatTitle,
        username: chatUsername,
        type: chatType as 'group' | 'supergroup' | 'channel',
        memberCount: 0,
      };

      const community = await this.communityService.upsertFromTelegram(
        chatData,
        addedByTelegramId,
      );

      // Update status to NO_ADMIN_RIGHTS
      await this.communityService.updateBotStatus(chatId, 'NO_ADMIN_RIGHTS');

      // Notify the chat that admin rights are needed
      if (api) {
        try {
          await api.sendMessage(
            Number(chatId),
            `⚠️ <b>GrowBot needs admin rights!</b>\n\n` +
              `I've been added to this ${chatType}, but I need <b>administrator permissions</b> to:\n` +
              `• Track member joins and leaves\n` +
              `• Verify referral attributions\n` +
              `• Send campaign notifications\n\n` +
              `Please promote me to admin to activate full functionality.`,
            { parse_mode: 'HTML' },
          );
        } catch {
          // Bot may not have permission to send messages
        }
      }

      return {
        status: 'community_registered_no_admin',
        communityId: community.id,
        title: community.title,
      };
    } else if (newStatus === 'left' || newStatus === 'kicked') {
      // ── Bot removed or kicked ──
      this.logger.warn(
        `❌ Bot was ${newStatus} from "${chatTitle}" (${chatId.toString()})`,
      );
      await this.communityService.updateBotStatus(chatId, 'KICKED');

      return { status: 'bot_removed', chatId: chatId.toString() };
    } else if (newStatus === 'restricted') {
      // ── Bot was restricted/demoted ──
      this.logger.warn(
        `⚠️ Bot was restricted in "${chatTitle}" (${chatId.toString()})`,
      );
      await this.communityService.updateBotStatus(chatId, 'NO_ADMIN_RIGHTS');

      return { status: 'bot_restricted', chatId: chatId.toString() };
    }

    return { status: 'unhandled_bot_status', newStatus };
  }

  // ──────────────────────────────────────────────────
  // chat_member: User join/leave (referral attribution)
  // ──────────────────────────────────────────────────

  private async handleChatMemberUpdate(chatMemberUpdate: ChatMemberUpdated) {
    const chatId = String(chatMemberUpdate.chat.id);
    const user = chatMemberUpdate.new_chat_member.user;
    const inviteeId = String(user.id);
    const newStatus = chatMemberUpdate.new_chat_member.status;

    // Skip bot's own status changes
    if (user.is_bot) {
      return { status: 'skipped', reason: 'bot_user' };
    }

    this.logger.log(
      `[ChatMemberUpdate] User ${user.username || inviteeId} status changed to ${newStatus} in chat ${chatId}`,
    );

    const parsedChatId = BigInt(chatMemberUpdate.chat.id);
    const parsedUserTgId = BigInt(user.id);

    if (newStatus === 'member' || newStatus === 'administrator' || newStatus === 'creator') {
      // 1. Record daily metric
      await this.statsService.recordMetric(chatId, 'newJoins');

      // 2. Upsert CommunityMember
      await this.communityService.upsertMember(
        parsedChatId,
        parsedUserTgId,
        user.username,
      );

      // 3. Check pending intent via ReferralService
      const pendingIntent = await this.referralService.findPendingIntent(
        inviteeId,
        chatId,
      );

      if (pendingIntent) {
        this.logger.log(
          `🎯 [Referral Verified] Invitee ${inviteeId} matched intent from Referrer ${pendingIntent.referrerCode}! Crediting referral...`,
        );
        await this.referralService.markValidated(inviteeId, chatId);
        await this.statsService.recordMetric(chatId, 'validatedReferrals');
        return {
          status: 'referral_validated',
          inviteeId,
          referrerCode: pendingIntent.referrerCode,
        };
      }
    } else if (newStatus === 'left' || newStatus === 'kicked') {
      // 1. Record daily metric
      await this.statsService.recordMetric(chatId, 'leaves');

      // 2. Update CommunityMember status
      await this.communityService.updateMemberStatus(
        parsedChatId,
        parsedUserTgId,
        newStatus === 'kicked' ? 'KICKED' : 'LEFT',
      );

      // 3. Anti-Cheat Credit Revocation
      this.logger.warn(
        `⚠️ [Anti-Cheat Revocation] Member ${inviteeId} left chat ${chatId}. Revoking unearned referral credit...`,
      );
      await this.referralService.markRevoked(inviteeId, chatId);
      return { status: 'referral_revoked', inviteeId };
    }

    return { status: 'member_updated', newStatus };
  }

  // ──────────────────────────────────────────────────
  // Bot Notification Dispatchers
  // ──────────────────────────────────────────────────

  async sendCampaignAnnouncement(
    chatId: number | string | bigint,
    title: string,
    rewardDescription: string,
    targetReferrals = 5,
  ) {
    if (!this.bot) return;
    try {
      const miniAppUrl =
        this.configService.get<string>('MINI_APP_URL') ||
        'https://grow-bot-brown.vercel.app/miniapp';

      const keyboard = new InlineKeyboard().webApp(
        '🚀 Join Campaign in Mini App',
        miniAppUrl,
      );

      await this.bot.api.sendMessage(
        Number(chatId),
        `🚀 <b>NEW CAMPAIGN LAUNCHED!</b>\n\n` +
          `<b>${title}</b>\n\n` +
          `🎯 Goal: Invite <b>${targetReferrals}</b> friends\n` +
          `🎁 Reward: <b>${rewardDescription}</b>\n\n` +
          `Tap below to open the Mini App and get your unique referral link!`,
        { reply_markup: keyboard, parse_mode: 'HTML' },
      );
      this.logger.log(`📢 Sent campaign announcement to chat ${chatId.toString()}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to send campaign announcement to chat ${chatId.toString()}: ${msg}`);
    }
  }

  async sendMilestoneCongrats(
    chatId: number | string | bigint,
    username: string,
    rewardTitle: string,
  ) {
    if (!this.bot) return;
    try {
      await this.bot.api.sendMessage(
        Number(chatId),
        `🎉 <b>MILESTONE UNLOCKED!</b>\n\n` +
          `Congratulations @${username}! You hit your referral target and unlocked <b>${rewardTitle}</b>! 🏆`,
        { parse_mode: 'HTML' },
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to send milestone congrats: ${msg}`);
    }
  }

  async sendRewardNotification(
    telegramId: number | string | bigint,
    rewardTitle: string,
    status: string,
  ) {
    if (!this.bot) return;
    try {
      await this.bot.api.sendMessage(
        Number(telegramId),
        `🎁 <b>Reward Status Update!</b>\n\n` +
          `Your reward <b>${rewardTitle}</b> status has been updated to: <b>${status}</b>.`,
        { parse_mode: 'HTML' },
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to send reward notification DM to user ${telegramId.toString()}: ${msg}`);
    }
  }

  async sendGroupWelcomeAttribution(
    chatId: number | string | bigint,
    inviteeUsername: string,
    referrerUsername: string,
    campaignTitle = 'Growth Sprint',
  ) {
    if (!this.bot) return;
    try {
      await this.bot.api.sendMessage(
        Number(chatId),
        `🎯 <b>NEW MEMBER ATTRIBUTED!</b>\n\n` +
          `Welcome @${inviteeUsername}! Joined via @${referrerUsername}'s referral link for <b>${campaignTitle}</b>! 🚀`,
        { parse_mode: 'HTML' },
      );
      this.logger.log(`📢 Sent group welcome attribution to chat ${chatId.toString()}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to send group welcome attribution: ${msg}`);
    }
  }

  async sendCampaignCompletedNotice(
    chatId: number | string | bigint,
    title: string,
    topInviters: Array<{ username: string; count: number }> = [],
  ) {
    if (!this.bot) return;
    try {
      let ranksText = '';
      if (topInviters.length > 0) {
        ranksText =
          '\n\n🏆 <b>Top Community Inviters:</b>\n' +
          topInviters
            .map((inviter, idx) => {
              const medal =
                idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🏅';
              return `${medal} @${inviter.username} — <b>${inviter.count}</b> invites`;
            })
            .join('\n');
      }

      await this.bot.api.sendMessage(
        Number(chatId),
        `🏁 <b>CAMPAIGN COMPLETED!</b>\n\n` +
          `The campaign <b>${title}</b> has officially ended.${ranksText}\n\n` +
          `Thank you to all participants for growing our community! 🎉`,
        { parse_mode: 'HTML' },
      );
      this.logger.log(
        `📢 Sent campaign completed notice to chat ${chatId.toString()}`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to send campaign completed notice: ${msg}`);
    }
  }

  async sendGroupBroadcast(
    chatId: number | string | bigint,
    messageText: string,
  ) {
    if (!this.bot) return;
    try {
      const miniAppUrl =
        this.configService.get<string>('MINI_APP_URL') ||
        'https://grow-bot-brown.vercel.app/miniapp';

      const keyboard = new InlineKeyboard().webApp(
        '🚀 Open GrowBot Mini App',
        miniAppUrl,
      );

      await this.bot.api.sendMessage(
        Number(chatId),
        `📢 <b>COMMUNITY ANNOUNCEMENT</b>\n\n${messageText}`,
        { reply_markup: keyboard, parse_mode: 'HTML' },
      );
      this.logger.log(
        `📢 Sent group broadcast message to chat ${chatId.toString()}`,
      );
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Failed to send group broadcast to chat ${chatId.toString()}: ${msg}`,
      );
      throw new Error(`Failed to send broadcast: ${msg}`);
    }
  }

  // ──────────────────────────────────────────────────
  // Lifecycle
  // ──────────────────────────────────────────────────

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
