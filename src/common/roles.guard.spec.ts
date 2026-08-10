import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import type { Role } from './roles.decorator';

function makeGuard(roles: Role[] | undefined) {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(roles),
  } as unknown as Reflector;
  return new RolesGuard(reflector);
}

function ctxWith(user: unknown): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('allows when no roles metadata', () => {
    expect(makeGuard(undefined).canActivate(ctxWith(null))).toBe(true);
  });

  it('allows when roles array empty', () => {
    expect(makeGuard([]).canActivate(ctxWith(null))).toBe(true);
  });

  it('allows when user has role', () => {
    expect(makeGuard(['ADMIN']).canActivate(ctxWith({ role: 'ADMIN' }))).toBe(
      true,
    );
  });

  it('forbids when role not allowed', () => {
    expect(() =>
      makeGuard(['ADMIN']).canActivate(ctxWith({ role: 'MEMBER' })),
    ).toThrow(ForbiddenException);
  });

  it('forbids when no user', () => {
    expect(() => makeGuard(['ADMIN']).canActivate(ctxWith(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
