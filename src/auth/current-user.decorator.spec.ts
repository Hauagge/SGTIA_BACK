import { ExecutionContext } from '@nestjs/common';
import { currentUserFactory } from './current-user.decorator';

describe('currentUserFactory', () => {
  it('returns req.user', () => {
    const user = { sub: 'u1', workspaceId: 'w1', role: 'ADMIN' };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
    expect(currentUserFactory(null, ctx)).toBe(user);
  });
});
