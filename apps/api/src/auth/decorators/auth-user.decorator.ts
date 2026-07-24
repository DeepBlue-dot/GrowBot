import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../auth.service';

interface RequestWithUser {
  user?: JwtPayload;
}

export const AuthUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    return data && user ? user[data] : user;
  },
);
