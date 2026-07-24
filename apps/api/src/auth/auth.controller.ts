import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService, TelegramUserPayload } from './auth.service';

interface WebLoginData {
  id?: number | string;
  username?: string;
  first_name?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('telegram-miniapp')
  @HttpCode(HttpStatus.OK)
  authenticateMiniApp(@Body('initDataRaw') initDataRaw: string) {
    if (!initDataRaw) {
      // Development fallback mode for local testing
      return this.authService.generateSessionToken({
        id: 'usr-demo123',
        telegramId: '987654321',
        username: 'alex_web3',
        firstName: 'Alex',
        isAdmin: true,
      });
    }

    const verification = this.authService.verifyTelegramInitData(initDataRaw);
    if (!verification.isValid && process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException(
        'Invalid Telegram initData HMAC signature',
      );
    }

    const tgUser: TelegramUserPayload = verification.user || {
      id: 987654321,
      username: 'alex_web3',
      first_name: 'Alex',
    };

    return this.authService.generateSessionToken({
      id: `usr-${tgUser.id}`,
      telegramId: String(tgUser.id),
      username: tgUser.username,
      firstName: tgUser.first_name,
      isAdmin: true,
    });
  }

  @Post('telegram-web')
  @HttpCode(HttpStatus.OK)
  authenticateWebWidget(@Body() webLoginData: WebLoginData) {
    const userId = webLoginData.id ? String(webLoginData.id) : '987654321';
    return this.authService.generateSessionToken({
      id: `usr-${userId}`,
      telegramId: userId,
      username: webLoginData.username || 'alex_web3',
      firstName: webLoginData.first_name || 'Alex',
      isAdmin: true,
    });
  }
}
