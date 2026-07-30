import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';

// ────────────────────────────────────────────────────────────────
// Interfaces & Types
// ────────────────────────────────────────────────────────────────

export interface JwtPayload {
  /** Internal database user UUID */
  sub: string;
  /** Telegram user ID (bigint as string) */
  telegramId: string;
  /** Telegram @username */
  username?: string;
  /** Telegram first name */
  firstName: string;
  /** Admin flag */
  isAdmin: boolean;
  /** JWT issued-at (epoch seconds) */
  iat?: number;
  /** JWT expiration (epoch seconds) */
  exp?: number;
}

export interface TelegramUserPayload {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: Omit<JwtPayload, 'iat' | 'exp'>;
}

// ────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────

const ACCESS_TOKEN_EXPIRY = '7d';
const ACCESS_TOKEN_EXPIRY_SECONDS = 7 * 24 * 3600;
const REFRESH_TOKEN_EXPIRY = '30d';
/** Maximum allowed age for auth_date before considering it stale (seconds) */
const MAX_AUTH_AGE_SECONDS = 86400; // 24 hours

// ────────────────────────────────────────────────────────────────
// Service
// ────────────────────────────────────────────────────────────────

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly botToken: string;
  private readonly jwtSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.botToken = this.configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
    this.jwtSecret = this.configService.getOrThrow<string>('JWT_SECRET');
  }

  // ──────────────────────────────────────────────────
  // 1. Telegram Mini App — initDataRaw HMAC Verification
  // ──────────────────────────────────────────────────

  /**
   * Verify Telegram Mini App `initDataRaw` using HMAC-SHA256.
   *
   * Algorithm (per Telegram docs):
   *   secretKey  = HMAC_SHA256("WebAppData", botToken)
   *   hash       = HMAC_SHA256(secretKey, dataCheckString)
   *   compare    = hash === receivedHash
   *
   * @see https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
   */
  verifyTelegramInitData(initDataRaw: string): {
    isValid: boolean;
    user?: TelegramUserPayload;
    authDate?: number;
  } {
    if (!initDataRaw) {
      return { isValid: false };
    }

    try {
      const urlParams = new URLSearchParams(initDataRaw);
      const receivedHash = urlParams.get('hash');
      const userStr = urlParams.get('user');
      const authDateStr = urlParams.get('auth_date');

      if (!receivedHash) {
        this.logger.warn('Mini App initData missing hash parameter');
        return { isValid: false };
      }

      // Build data-check-string: alphabetically sorted key=value pairs, excluding "hash"
      urlParams.delete('hash');
      const dataCheckString = Array.from(urlParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      // Derive secret key: HMAC_SHA256("WebAppData", botToken)
      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(this.botToken)
        .digest();

      // Calculate expected hash
      const calculatedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      // Constant-time comparison to prevent timing attacks
      const isValid =
        calculatedHash.length === receivedHash.length &&
        crypto.timingSafeEqual(
          Buffer.from(calculatedHash, 'hex'),
          Buffer.from(receivedHash, 'hex'),
        );

      if (!isValid) {
        this.logger.warn('Mini App initData HMAC verification failed');
        return { isValid: false };
      }

      // Check auth_date staleness
      const authDate = authDateStr ? parseInt(authDateStr, 10) : undefined;
      if (authDate) {
        const now = Math.floor(Date.now() / 1000);
        if (now - authDate > MAX_AUTH_AGE_SECONDS) {
          this.logger.warn(
            `Mini App initData is stale (auth_date=${authDate}, now=${now}, delta=${now - authDate}s)`,
          );
          return { isValid: false };
        }
      }

      const user = userStr
        ? (JSON.parse(userStr) as TelegramUserPayload)
        : undefined;

      return { isValid: true, user, authDate };
    } catch (error: unknown) {
      this.logger.error(
        'Error verifying Telegram initDataRaw',
        error instanceof Error ? error.stack : String(error),
      );
      return { isValid: false };
    }
  }

  // ──────────────────────────────────────────────────
  // 2. Telegram Web Login Widget — HMAC Verification
  // ──────────────────────────────────────────────────

  /**
   * Verify Telegram Login Widget data using HMAC-SHA256.
   *
   * Algorithm (per Telegram docs):
   *   secretKey  = SHA256(botToken)
   *   hash       = HMAC_SHA256(secretKey, dataCheckString)
   *   compare    = hash === receivedHash
   *
   * @see https://core.telegram.org/widgets/login#checking-authorization
   */
  verifyTelegramWebLogin(data: Record<string, unknown>): {
    isValid: boolean;
    user?: TelegramUserPayload;
  } {
    try {
      const { hash, ...rest } = data;
      if (!hash || typeof hash !== 'string') {
        this.logger.warn('Web login data missing hash field');
        return { isValid: false };
      }

      // Build data-check-string from all fields except "hash"
      const dataCheckString = Object.entries(rest)
        .filter(([, v]) => v !== undefined && v !== null)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      // Secret key for Web Widget: SHA256(botToken) — NOT HMAC, plain hash
      const secretKey = crypto
        .createHash('sha256')
        .update(this.botToken)
        .digest();

      // Calculate expected hash
      const calculatedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      // Constant-time comparison
      const isValid =
        calculatedHash.length === hash.length &&
        crypto.timingSafeEqual(
          Buffer.from(calculatedHash, 'hex'),
          Buffer.from(hash, 'hex'),
        );

      if (!isValid) {
        this.logger.warn('Web login HMAC verification failed');
        return { isValid: false };
      }

      // Check auth_date staleness
      const authDate = rest.auth_date as number | undefined;
      if (authDate) {
        const now = Math.floor(Date.now() / 1000);
        if (now - authDate > MAX_AUTH_AGE_SECONDS) {
          this.logger.warn(
            `Web login data is stale (auth_date=${authDate}, delta=${now - authDate}s)`,
          );
          return { isValid: false };
        }
      }

      const user: TelegramUserPayload = {
        id: rest.id as number,
        first_name: (rest.first_name as string) || 'Unknown',
        last_name: rest.last_name as string | undefined,
        username: rest.username as string | undefined,
        photo_url: rest.photo_url as string | undefined,
      };

      return { isValid: true, user };
    } catch (error: unknown) {
      this.logger.error(
        'Error verifying Telegram Web Login data',
        error instanceof Error ? error.stack : String(error),
      );
      return { isValid: false };
    }
  }

  // ──────────────────────────────────────────────────
  // 3. User Upsert (find-or-create in PostgreSQL)
  // ──────────────────────────────────────────────────

  /**
   * Find existing user by telegramId or create a new one.
   * Returns the internal database user record.
   */
  async upsertUser(tgUser: TelegramUserPayload): Promise<{
    id: string;
    telegramId: string;
    username?: string;
    firstName: string;
    isAdmin: boolean;
  }> {
    const telegramId = BigInt(tgUser.id);

    const user = await this.prisma.user.upsert({
      where: { telegramId },
      update: {
        username: tgUser.username ?? undefined,
        firstName: tgUser.first_name,
        lastName: tgUser.last_name ?? undefined,
        photoUrl: tgUser.photo_url ?? undefined,
      },
      create: {
        telegramId,
        username: tgUser.username ?? undefined,
        firstName: tgUser.first_name,
        lastName: tgUser.last_name ?? undefined,
        photoUrl: tgUser.photo_url ?? undefined,
        isAdmin: false,
      },
    });

    this.logger.log(
      `Upserted user: telegramId=${tgUser.id}, dbId=${user.id}, username=${user.username}`,
    );

    return {
      id: user.id,
      telegramId: user.telegramId.toString(),
      username: user.username ?? undefined,
      firstName: user.firstName,
      isAdmin: user.isAdmin,
    };
  }

  // ──────────────────────────────────────────────────
  // 4. JWT Token Generation
  // ──────────────────────────────────────────────────

  /**
   * Generate a signed JWT access token and a refresh token for the user.
   */
  generateTokens(user: {
    id: string;
    telegramId: string;
    username?: string;
    firstName: string;
    isAdmin: boolean;
  }): AuthTokenResponse {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: user.id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      isAdmin: user.isAdmin,
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    const refreshToken = jwt.sign(
      { sub: user.id, type: 'refresh' },
      this.jwtSecret,
      { expiresIn: REFRESH_TOKEN_EXPIRY },
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
      user: payload,
    };
  }

  // ──────────────────────────────────────────────────
  // 5. JWT Token Verification
  // ──────────────────────────────────────────────────

  /**
   * Verify and decode a JWT access token.
   * Throws UnauthorizedException if invalid or expired.
   */
  verifyToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JwtPayload;
      return decoded;
    } catch (error: unknown) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token');
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  // ──────────────────────────────────────────────────
  // 6. JWT Token Refresh
  // ──────────────────────────────────────────────────

  /**
   * Verify a refresh token and issue new access + refresh tokens.
   */
  async refreshTokens(refreshToken: string): Promise<AuthTokenResponse> {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtSecret) as {
        sub: string;
        type: string;
      };

      if (decoded.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token type');
      }

      // Look up user in database to ensure they still exist
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User no longer exists');
      }

      return this.generateTokens({
        id: user.id,
        telegramId: user.telegramId.toString(),
        username: user.username ?? undefined,
        firstName: user.firstName,
        isAdmin: user.isAdmin,
      });
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
