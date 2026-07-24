import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
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
    const payload = this.authService.verifyToken(token);
    request.user = payload;
    return true;
  }
}
