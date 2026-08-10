import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';
import { createDbMock } from '../common/testing/db-mock';

const activeUser = {
  id: 'u1',
  workspaceId: 'w1',
  role: 'ADMIN' as const,
  active: true,
};

function makeCtx(req: unknown): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

function makeGuard(opts: {
  isPublic?: boolean;
  verify?: jest.Mock;
  queue?: unknown[];
}) {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(opts.isPublic ?? false),
  } as unknown as Reflector;
  const jwt = {
    verifyAsync: opts.verify ?? jest.fn().mockResolvedValue({ sub: 'u1' }),
  } as unknown as JwtService;
  const { db } = createDbMock(opts.queue ?? []);
  return new JwtAuthGuard(jwt, reflector, db);
}

describe('JwtAuthGuard', () => {
  it('allows public routes', async () => {
    const guard = makeGuard({ isPublic: true });
    await expect(guard.canActivate(makeCtx({}))).resolves.toBe(true);
  });

  it('rejects when no token', async () => {
    const guard = makeGuard({});
    await expect(
      guard.canActivate(makeCtx({ cookies: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects when token invalid', async () => {
    const guard = makeGuard({
      verify: jest.fn().mockRejectedValue(new Error('bad')),
    });
    await expect(
      guard.canActivate(makeCtx({ cookies: { token: 'x' } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects when user not found', async () => {
    const guard = makeGuard({ queue: [[]] });
    await expect(
      guard.canActivate(makeCtx({ cookies: { token: 'x' } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects when user inactive', async () => {
    const guard = makeGuard({ queue: [[{ ...activeUser, active: false }]] });
    await expect(
      guard.canActivate(makeCtx({ cookies: { token: 'x' } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('sets user and allows when valid', async () => {
    const guard = makeGuard({ queue: [[activeUser]] });
    const req: { cookies: { token: string }; user?: unknown } = {
      cookies: { token: 'x' },
    };
    const result = await guard.canActivate(makeCtx(req));
    expect(result).toBe(true);
    expect(req.user).toEqual({ sub: 'u1', workspaceId: 'w1', role: 'ADMIN' });
  });
});
