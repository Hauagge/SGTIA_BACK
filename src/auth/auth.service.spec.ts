import { ConflictException, UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { createDbMock } from '../common/testing/db-mock';

jest.mock('bcryptjs');

const baseUser = {
  id: 'u1',
  workspaceId: 'w1',
  name: 'Ana',
  email: 'ana@logiccos.com',
  passwordHash: 'hash',
  role: 'ADMIN' as const,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeService(queue: unknown[]) {
  const { db } = createDbMock(queue);
  const jwt = { signAsync: jest.fn().mockResolvedValue('token') };
  return new AuthService(db, jwt as unknown as JwtService);
}

describe('AuthService', () => {
  beforeEach(() => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  describe('register', () => {
    it('rejects duplicate email', async () => {
      const service = makeService([[{ id: 'x' }]]);
      await expect(
        service.register({ name: 'Ana', email: 'a@a.com', password: '123456' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('first user creates workspace and becomes ADMIN', async () => {
      const service = makeService([
        [],
        [],
        [{ id: 'w1' }],
        [],
        [{ ...baseUser, role: 'ADMIN' }],
      ]);
      const result = await service.register({
        name: 'Ana',
        email: 'ana@logiccos.com',
        password: '123456',
      });
      expect(result.role).toBe('ADMIN');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('subsequent user reuses workspace and becomes MEMBER', async () => {
      const service = makeService([
        [],
        [{ id: 'w1' }],
        [{ id: 'u0' }],
        [{ ...baseUser, id: 'u2', role: 'MEMBER' }],
      ]);
      const result = await service.register({
        name: 'Bruno',
        email: 'bruno@logiccos.com',
        password: '123456',
      });
      expect(result.role).toBe('MEMBER');
    });
  });

  describe('validate', () => {
    it('throws when user not found', async () => {
      const service = makeService([[]]);
      await expect(
        service.validate({ email: 'x@x.com', password: '123456' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws when user inactive', async () => {
      const service = makeService([[{ ...baseUser, active: false }]]);
      await expect(
        service.validate({ email: 'a@a.com', password: '123456' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws when password mismatch', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const service = makeService([[baseUser]]);
      await expect(
        service.validate({ email: 'a@a.com', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns user on success', async () => {
      const service = makeService([[baseUser]]);
      const user = await service.validate({
        email: 'a@a.com',
        password: '123456',
      });
      expect(user.id).toBe('u1');
    });
  });

  describe('sign', () => {
    it('signs a token with sub', async () => {
      const service = makeService([]);
      const token = await service.sign({
        id: 'u1',
        workspaceId: 'w1',
        role: 'ADMIN',
      });
      expect(token).toBe('token');
    });
  });

  describe('me', () => {
    it('throws when user missing', async () => {
      const service = makeService([[]]);
      await expect(service.me('u1')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('returns public user', async () => {
      const service = makeService([[baseUser]]);
      const result = await service.me('u1');
      expect(result).toEqual({
        id: 'u1',
        name: 'Ana',
        email: 'ana@logiccos.com',
        role: 'ADMIN',
        workspaceId: 'w1',
        active: true,
      });
    });
  });
});
