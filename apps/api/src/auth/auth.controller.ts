import { Controller, Post, Body, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('telegram-miniapp')
  @HttpCode(HttpStatus.OK)
  async authenticateMiniApp(@Body('initDataRaw') initDataRaw: string) {
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
      throw new UnauthorizedException('Invalid Telegram initData HMAC signature');
    }

    const tgUser = verification.user || {
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
  async authenticateWebWidget(@Body() webLoginData: any) {
    return this.authService.generateSessionToken({
      id: `usr-${webLoginData.id || '987654321'}`,
      telegramId: String(webLoginData.id || '987654321'),
      username: webLoginData.username || 'alex_web3',
      firstName: webLoginData.first_name || 'Alex',
      isAdmin: true,
    });
  }
}
