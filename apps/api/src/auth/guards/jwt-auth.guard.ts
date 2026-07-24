import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService, JwtPayload } from '../auth.service';

interface RequestWithUser extends Request {
  user?: JwtPayload;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Allow development bypass if token omitted in dev mode
      if (process.env.NODE_ENV !== 'production') {
        request.user = {
          sub: 'usr-demo123',
          telegramId: '987654321',
          username: 'alex_web3',
          firstName: 'Alex',
          isAdmin: true,
        };
        return true;
      }
      throw new UnauthorizedException('Missing Authorization Bearer token');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Malformed Authorization Bearer token');
    }
    const payload = this.authService.verifyToken(token);
    request.user = payload;
    return true;
  }
}
