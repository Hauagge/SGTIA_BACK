import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../database/drizzle.constants';
import type { DrizzleDB } from '../database/drizzle.module';
import { users } from '../database/schema';
import { IS_PUBLIC } from './public.decorator';

export interface AuthUser {
  sub: string;
  workspaceId: string;
  role: 'ADMIN' | 'MEMBER';
}

type RequestWithUser = Request & {
  user?: AuthUser;
  cookies: Record<string, string>;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<RequestWithUser>();
    const cookies = req.cookies as Record<string, string>;
    const token = cookies.token;
    if (!token) throw new UnauthorizedException();

    let sub: string;
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token);
      sub = payload.sub;
    } catch {
      throw new UnauthorizedException();
    }

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, sub))
      .limit(1);
    if (!user || !user.active) throw new UnauthorizedException();

    req.user = {
      sub: user.id,
      workspaceId: user.workspaceId,
      role: user.role,
    };
    return true;
  }
}
