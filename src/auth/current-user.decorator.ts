import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from './jwt-auth.guard';

export const currentUserFactory = (
  _data: unknown,
  ctx: ExecutionContext,
): AuthUser => {
  return ctx.switchToHttp().getRequest<{ user: AuthUser }>().user;
};

export const CurrentUser = createParamDecorator(currentUserFactory);
