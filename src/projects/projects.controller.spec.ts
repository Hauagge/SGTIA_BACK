import { ProjectsController } from './projects.controller';
import type { ProjectsService } from './projects.service';
import type { AuthUser } from '../auth/jwt-auth.guard';

const user: AuthUser = { sub: 'u1', workspaceId: 'w1', role: 'ADMIN' };

describe('ProjectsController', () => {
  let service: jest.Mocked<
    Pick<
      ProjectsService,
      | 'list'
      | 'create'
      | 'getOne'
      | 'update'
      | 'listMembers'
      | 'addMember'
      | 'removeMember'
    >
  >;
  let controller: ProjectsController;

  beforeEach(() => {
    service = {
      list: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'p1' }),
      getOne: jest.fn().mockResolvedValue({ id: 'p1' }),
      update: jest.fn().mockResolvedValue({ id: 'p1' }),
      listMembers: jest.fn().mockResolvedValue([]),
      addMember: jest.fn().mockResolvedValue({ ok: true }),
      removeMember: jest.fn().mockResolvedValue({ ok: true }),
    };
    controller = new ProjectsController(service as unknown as ProjectsService);
  });

  it('list delegates', async () => {
    await controller.list(user);
    expect(service.list).toHaveBeenCalledWith(user);
  });

  it('create delegates', async () => {
    await controller.create(user, { name: 'X' });
    expect(service.create).toHaveBeenCalledWith(user, { name: 'X' });
  });

  it('getOne delegates', async () => {
    await controller.getOne(user, 'p1');
    expect(service.getOne).toHaveBeenCalledWith(user, 'p1');
  });

  it('update delegates', async () => {
    await controller.update(user, 'p1', { name: 'Y' });
    expect(service.update).toHaveBeenCalledWith(user, 'p1', { name: 'Y' });
  });

  it('members delegates', async () => {
    await controller.members(user, 'p1');
    expect(service.listMembers).toHaveBeenCalledWith(user, 'p1');
  });

  it('addMember delegates', async () => {
    await controller.addMember(user, 'p1', { userId: 'u2' });
    expect(service.addMember).toHaveBeenCalledWith(user, 'p1', {
      userId: 'u2',
    });
  });

  it('removeMember delegates', async () => {
    await controller.removeMember(user, 'p1', 'u2');
    expect(service.removeMember).toHaveBeenCalledWith(user, 'p1', 'u2');
  });
});
