import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '../auth.service.js';

interface RequestWithUser {
  user?: JwtPayload;
}

/**
 * Parameter decorator that extracts the authenticated user from the request.
 * Use with @UseGuards(JwtAuthGuard) on the route.
 *
 * @example
 * ```ts
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@AuthUser() user: JwtPayload) { ... }
 *
 * // Or extract a single field:
 * getProfile(@AuthUser('sub') userId: string) { ... }
 * ```
 */
export const AuthUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    return data && user ? user[data] : user;
  },
);
