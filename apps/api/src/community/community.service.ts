import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface CommunityItem {
  id: string;
  workspaceId: string;
  telegramChatId: string;
  title: string;
  username?: string;
  type: 'GROUP' | 'SUPERGROUP' | 'CHANNEL';
  memberCount: number;
  botIsAdmin: boolean;
  inviteLink?: string;
}

/**
 * Data from Telegram's `getChat` or `my_chat_member` update,
 * used to auto-register or update a community.
 */
export interface TelegramChatData {
  /** Telegram chat ID (negative number for groups/channels) */
  chatId: bigint;
  /** Chat title */
  title: string;
  /** Chat @username (optional) */
  username?: string;
  /** Chat type as reported by Telegram */
  type: 'group' | 'supergroup' | 'channel' | 'private';
  /** Member count if available */
  memberCount?: number;
  /** Invite link if available */
  inviteLink?: string;
}

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────
  // Query Methods
  // ──────────────────────────────────────────────────

  async findByWorkspace(workspaceId?: string): Promise<CommunityItem[]> {
    const dbCommunities = await this.prisma.community.findMany({
      where: workspaceId ? { workspaceId } : undefined,
    });

    return dbCommunities.map((c) => ({
      id: c.id,
      workspaceId: c.workspaceId,
      telegramChatId: String(c.telegramChatId),
      title: c.title,
      username: c.username || undefined,
      type: c.type,
      memberCount: c.memberCount,
      botIsAdmin: c.botStatus === 'ACTIVE',
      inviteLink: c.inviteLink || undefined,
    }));
  }

  async findOne(id: string): Promise<CommunityItem> {
    const community = await this.prisma.community.findUnique({
      where: { id },
    });

    if (!community) {
      throw new NotFoundException(`Community ${id} not found`);
    }

    return {
      id: community.id,
      workspaceId: community.workspaceId,
      telegramChatId: String(community.telegramChatId),
      title: community.title,
      username: community.username || undefined,
      type: community.type,
      memberCount: community.memberCount,
      botIsAdmin: community.botStatus === 'ACTIVE',
      inviteLink: community.inviteLink || undefined,
    };
  }

  async findByTelegramChatId(chatId: bigint): Promise<CommunityItem | null> {
    const community = await this.prisma.community.findUnique({
      where: { telegramChatId: chatId },
    });

    if (!community) return null;

    return {
      id: community.id,
      workspaceId: community.workspaceId,
      telegramChatId: String(community.telegramChatId),
      title: community.title,
      username: community.username || undefined,
      type: community.type,
      memberCount: community.memberCount,
      botIsAdmin: community.botStatus === 'ACTIVE',
      inviteLink: community.inviteLink || undefined,
    };
  }

  // ──────────────────────────────────────────────────
  // Auto-Registration (my_chat_member handler)
  // ──────────────────────────────────────────────────

  /**
   * Upsert a community from Telegram `my_chat_member` / `getChat` data.
   *
   * Flow:
   * 1. Map Telegram chat type to our CommunityType enum
   * 2. Find the admin user's workspace (or create a default one)
   * 3. Upsert the community record by telegramChatId
   */
  async upsertFromTelegram(
    chatData: TelegramChatData,
    adminTelegramId: bigint,
  ): Promise<CommunityItem> {
    const communityType = this.mapChatType(chatData.type);

    // Find the user who added the bot
    const adminUser = await this.prisma.user.findUnique({
      where: { telegramId: adminTelegramId },
      include: { ownedWorkspaces: true },
    });

    // Determine which workspace to link this community to
    let workspaceId: string;

    if (adminUser && adminUser.ownedWorkspaces.length > 0) {
      // Use their first workspace
      workspaceId = adminUser.ownedWorkspaces[0].id;
    } else if (adminUser) {
      // User exists but has no workspace — create a default one
      const slug = `ws-${adminUser.telegramId.toString()}`;
      const workspace = await this.prisma.workspace.create({
        data: {
          ownerId: adminUser.id,
          name: `${adminUser.firstName}'s Workspace`,
          slug,
          plan: 'FREE',
          maxCommunities: 3,
          maxCampaigns: 5,
        },
      });
      workspaceId = workspace.id;
      this.logger.log(
        `Created default workspace "${workspace.name}" (${workspace.id}) for user ${adminUser.firstName}`,
      );
    } else {
      // Unknown user — create both user and workspace
      const newUser = await this.prisma.user.create({
        data: {
          telegramId: adminTelegramId,
          firstName: 'Unknown',
          isAdmin: true,
        },
      });
      const workspace = await this.prisma.workspace.create({
        data: {
          ownerId: newUser.id,
          name: 'My Workspace',
          slug: `ws-${adminTelegramId.toString()}`,
          plan: 'FREE',
          maxCommunities: 3,
          maxCampaigns: 5,
        },
      });
      workspaceId = workspace.id;
      this.logger.log(
        `Created new user (telegramId=${adminTelegramId}) and default workspace (${workspace.id})`,
      );
    }

    // Upsert the community
    const community = await this.prisma.community.upsert({
      where: { telegramChatId: chatData.chatId },
      update: {
        title: chatData.title,
        username: chatData.username ?? null,
        type: communityType,
        memberCount: chatData.memberCount ?? 0,
        inviteLink: chatData.inviteLink ?? null,
        botStatus: 'ACTIVE',
      },
      create: {
        workspaceId,
        telegramChatId: chatData.chatId,
        title: chatData.title,
        username: chatData.username ?? null,
        type: communityType,
        memberCount: chatData.memberCount ?? 0,
        inviteLink: chatData.inviteLink ?? null,
        botStatus: 'ACTIVE',
      },
    });

    this.logger.log(
      `✅ Community upserted: "${community.title}" (chatId=${chatData.chatId}, dbId=${community.id}, workspace=${workspaceId})`,
    );

    return {
      id: community.id,
      workspaceId: community.workspaceId,
      telegramChatId: String(community.telegramChatId),
      title: community.title,
      username: community.username || undefined,
      type: community.type,
      memberCount: community.memberCount,
      botIsAdmin: community.botStatus === 'ACTIVE',
      inviteLink: community.inviteLink || undefined,
    };
  }

  // ──────────────────────────────────────────────────
  // Bot Status Updates
  // ──────────────────────────────────────────────────

  /**
   * Update the bot's status in a community (e.g. when removed or demoted).
   */
  async updateBotStatus(
    chatId: bigint,
    status: 'ACTIVE' | 'INACTIVE' | 'KICKED' | 'NO_ADMIN_RIGHTS',
  ): Promise<void> {
    try {
      await this.prisma.community.update({
        where: { telegramChatId: chatId },
        data: { botStatus: status },
      });
      this.logger.log(
        `Updated bot status to ${status} for chat ${chatId.toString()}`,
      );
    } catch {
      // Community may not exist yet — that's fine if bot was never registered
      this.logger.warn(
        `Could not update bot status for chat ${chatId.toString()} (community may not exist)`,
      );
    }
  }

  // ──────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────

  private mapChatType(
    tgType: string,
  ): 'GROUP' | 'SUPERGROUP' | 'CHANNEL' {
    switch (tgType) {
      case 'supergroup':
        return 'SUPERGROUP';
      case 'channel':
        return 'CHANNEL';
      case 'group':
      default:
        return 'GROUP';
    }
  }
}
