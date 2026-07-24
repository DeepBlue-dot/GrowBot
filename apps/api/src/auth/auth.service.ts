import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface JwtPayload {
  sub: string;
  telegramId: string;
  username?: string;
  firstName: string;
  isAdmin: boolean;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly configService: ConfigService) {}

  verifyTelegramInitData(initDataRaw: string): { isValid: boolean; user?: any } {
    if (!initDataRaw) {
      return { isValid: false };
    }

    try {
      const urlParams = new URLSearchParams(initDataRaw);
      const hash = urlParams.get('hash');
      const userStr = urlParams.get('user');

      if (!hash) {
        return { isValid: false };
      }

      const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN') || '7890123456:ABCdefGHIjklMNOpqrsTUVwxyz123456';

      urlParams.delete('hash');
      const dataCheckString = Array.from(urlParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
      const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

      const isValid = calculatedHash === hash;
      const user = userStr ? JSON.parse(userStr) : null;

      return { isValid, user };
    } catch (error) {
      this.logger.error('Error verifying Telegram initDataRaw signature', error);
      return { isValid: false };
    }
  }

  generateSessionToken(user: { id: string; telegramId: string; username?: string; firstName: string; isAdmin?: boolean }) {
    const payload: JwtPayload = {
      sub: user.id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      isAdmin: user.isAdmin || false,
    };

    // Lightweight HMAC token string representation
    const tokenPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const secret = this.configService.get<string>('JWT_SECRET') || 'growbot_secret_key';
    const signature = crypto.createHmac('sha256', secret).update(tokenPayload).digest('base64url');

    return {
      accessToken: `${tokenPayload}.${signature}`,
      expiresIn: 86400 * 7,
      user: payload,
    };
  }

  verifyToken(token: string): JwtPayload {
    try {
      const [tokenPayload, signature] = token.split('.');
      if (!tokenPayload || !signature) {
        throw new UnauthorizedException('Invalid token format');
      }

      const secret = this.configService.get<string>('JWT_SECRET') || 'growbot_secret_key';
      const expectedSignature = crypto.createHmac('sha256', secret).update(tokenPayload).digest('base64url');

      if (signature !== expectedSignature) {
        throw new UnauthorizedException('Invalid token signature');
      }

      const payload = JSON.parse(Buffer.from(tokenPayload, 'base64url').toString('utf-8'));
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Authentication token invalid or expired');
    }
  }
}
