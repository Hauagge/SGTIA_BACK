import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import type { AuthUser } from '../auth/jwt-auth.guard';
import { createDbMock } from '../common/testing/db-mock';

const admin: AuthUser = { sub: 'u1', workspaceId: 'w1', role: 'ADMIN' };
const member: AuthUser = { sub: 'u2', workspaceId: 'w1', role: 'MEMBER' };
const project = { id: 'p1', workspaceId: 'w1', name: 'AgendouAI' };

function service(queue: unknown[]) {
  const { db } = createDbMock(queue);
  return new ProjectsService(db);
}

describe('ProjectsService', () => {
  it('list returns all workspace projects for ADMIN', async () => {
    const result = await service([[project]]).list(admin);
    expect(result).toEqual([project]);
  });

  it('list returns member projects for MEMBER', async () => {
    const result = await service([[project]]).list(member);
    expect(result).toEqual([project]);
  });

  it('create inserts project and owner membership', async () => {
    const result = await service([[project], undefined]).create(admin, {
      name: 'AgendouAI',
    });
    expect(result).toEqual(project);
  });

  it('getOne returns project for ADMIN', async () => {
    const result = await service([[project]]).getOne(admin, 'p1');
    expect(result).toEqual(project);
  });

  it('getOne returns project for member', async () => {
    const result = await service([[project], [{ userId: 'u2' }]]).getOne(
      member,
      'p1',
    );
    expect(result).toEqual(project);
  });

  it('getOne forbids non-member', async () => {
    await expect(
      service([[project], []]).getOne(member, 'p1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('getOne 404 when not in workspace', async () => {
    await expect(service([[]]).getOne(admin, 'p1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('update returns updated project', async () => {
    const updated = { ...project, name: 'Novo' };
    const result = await service([[project], [updated]]).update(admin, 'p1', {
      name: 'Novo',
    });
    expect(result).toEqual(updated);
  });

  it('listMembers returns members', async () => {
    const members = [{ userId: 'u2', name: 'Bruno' }];
    const result = await service([[project], members]).listMembers(admin, 'p1');
    expect(result).toEqual(members);
  });

  it('addMember 404 when target not in workspace', async () => {
    await expect(
      service([[project], []]).addMember(admin, 'p1', { userId: 'u9' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('addMember inserts membership', async () => {
    const result = await service([
      [project],
      [{ id: 'u2' }],
      undefined,
    ]).addMember(admin, 'p1', { userId: 'u2' });
    expect(result).toEqual({ ok: true });
  });

  it('removeMember deletes membership', async () => {
    const result = await service([[project], undefined]).removeMember(
      admin,
      'p1',
      'u2',
    );
    expect(result).toEqual({ ok: true });
  });
});
