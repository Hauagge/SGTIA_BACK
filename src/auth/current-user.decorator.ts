import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from './jwt-auth.guard';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return ctx.switchToHttp().getRequest().user;
  },
);
