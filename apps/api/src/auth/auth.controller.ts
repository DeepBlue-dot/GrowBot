import {
  Controller,
  Post,
  Body,
  Get,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AuthService, AuthTokenResponse } from './auth.service.js';
import { TelegramMiniAppLoginDto } from './dto/telegram-miniapp-login.dto.js';
import { TelegramWebLoginDto } from './dto/telegram-web-login.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { AuthUser } from './decorators/auth-user.decorator.js';
import type { JwtPayload } from './auth.service.js';

// ────────────────────────────────────────────────────────────────
// Auth Controller
// ────────────────────────────────────────────────────────────────

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/telegram-miniapp
   *
   * Authenticate via Telegram Mini App initDataRaw.
   * Verifies HMAC-SHA256 signature, upserts user in DB, returns JWT.
   */
  @Post('telegram-miniapp')
  @HttpCode(HttpStatus.OK)
  async authenticateMiniApp(
    @Body() dto: TelegramMiniAppLoginDto,
  ): Promise<AuthTokenResponse> {
    const { initDataRaw } = dto;

    // 1. Verify HMAC signature
    const verification = this.authService.verifyTelegramInitData(initDataRaw);
    if (!verification.isValid) {
      throw new UnauthorizedException(
        'Invalid Telegram Mini App initData signature',
      );
    }

    if (!verification.user) {
      throw new UnauthorizedException(
        'Telegram initData does not contain user information',
      );
    }

    this.logger.log(
      `Mini App login: telegramId=${verification.user.id}, username=${verification.user.username}`,
    );

    // 2. Upsert user in database
    const dbUser = await this.authService.upsertUser(verification.user);

    // 3. Generate JWT tokens
    return this.authService.generateTokens(dbUser);
  }

  /**
   * POST /api/auth/telegram-web
   *
   * Authenticate via Telegram Login Widget callback data.
   * Verifies HMAC-SHA256 signature (different key derivation from Mini App),
   * upserts user in DB, returns JWT.
   */
  @Post('telegram-web')
  @HttpCode(HttpStatus.OK)
  async authenticateWebWidget(
    @Body() dto: TelegramWebLoginDto,
  ): Promise<AuthTokenResponse> {
    // 1. Verify HMAC signature (Web Widget uses SHA256(botToken) as key)
    const verification = this.authService.verifyTelegramWebLogin(
      dto as unknown as Record<string, unknown>,
    );
    if (!verification.isValid) {
      throw new UnauthorizedException(
        'Invalid Telegram Web Login Widget signature',
      );
    }

    if (!verification.user) {
      throw new UnauthorizedException(
        'Telegram login data does not contain user information',
      );
    }

    this.logger.log(
      `Web login: telegramId=${verification.user.id}, username=${verification.user.username}`,
    );

    // 2. Upsert user in database
    const dbUser = await this.authService.upsertUser(verification.user);

    // 3. Generate JWT tokens
    return this.authService.generateTokens(dbUser);
  }

  /**
   * POST /api/auth/refresh
   *
   * Exchange a valid refresh token for a new access + refresh token pair.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
  ): Promise<AuthTokenResponse> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    return this.authService.refreshTokens(refreshToken);
  }

  /**
   * GET /api/auth/me
   *
   * Returns the authenticated user's profile from the JWT payload.
   * Requires a valid Bearer token.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@AuthUser() user: JwtPayload) {
    return {
      id: user.sub,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      isAdmin: user.isAdmin,
    };
  }
}
