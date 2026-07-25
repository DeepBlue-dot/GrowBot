import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../guards/jwt-auth.guard.js';

/**
 * Mark a route as public — bypasses JWT authentication.
 * Use on controllers or individual route handlers.
 *
 * @example
 * ```ts
 * @Public()
 * @Get('health')
 * health() { return { ok: true }; }
 * ```
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
