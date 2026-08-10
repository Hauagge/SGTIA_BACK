import type { Response } from 'express';
import { AuthController } from './auth.controller';
import type { AuthService } from './auth.service';
import type { AuthUser } from './jwt-auth.guard';

function makeRes() {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;
}

describe('AuthController', () => {
  const user = { sub: 'u1', workspaceId: 'w1', role: 'ADMIN' };
  let auth: jest.Mocked<
    Pick<AuthService, 'register' | 'validate' | 'sign' | 'me' | 'publicUser'>
  >;
  let controller: AuthController;

  beforeEach(() => {
    auth = {
      register: jest.fn().mockResolvedValue(user),
      validate: jest.fn().mockResolvedValue(user),
      sign: jest.fn().mockResolvedValue('token'),
      me: jest.fn().mockResolvedValue({ id: 'u1' }),
      publicUser: jest.fn().mockReturnValue({ id: 'u1' }),
    };
    controller = new AuthController(auth as unknown as AuthService);
  });

  it('register sets cookie and returns user', async () => {
    const res = makeRes();
    const result = await controller.register(
      { name: 'Ana', email: 'a@a.com', password: '123456' },
      res,
    );
    expect(auth.register).toHaveBeenCalled();
    expect(res.cookie).toHaveBeenCalledWith(
      'token',
      'token',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(result).toBe(user);
  });

  it('login sets cookie and returns public user', async () => {
    const res = makeRes();
    const result = await controller.login(
      { email: 'a@a.com', password: '123456' },
      res,
    );
    expect(auth.validate).toHaveBeenCalled();
    expect(res.cookie).toHaveBeenCalled();
    expect(result).toEqual({ id: 'u1' });
  });

  it('logout clears cookie', () => {
    const res = makeRes();
    const result = controller.logout(res);
    expect(res.clearCookie).toHaveBeenCalledWith('token', expect.any(Object));
    expect(result).toEqual({ ok: true });
  });

  it('me returns current user', async () => {
    await controller.me(user as AuthUser);
    expect(auth.me).toHaveBeenCalledWith('u1');
  });
});
