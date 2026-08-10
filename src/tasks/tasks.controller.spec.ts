import { TasksController } from './tasks.controller';
import type { TasksService } from './tasks.service';
import type { AuthUser } from '../auth/jwt-auth.guard';

const user: AuthUser = { sub: 'u1', workspaceId: 'w1', role: 'MEMBER' };

describe('TasksController', () => {
  let service: jest.Mocked<
    Pick<TasksService, 'list' | 'create' | 'getOne' | 'update' | 'addComment'>
  >;
  let controller: TasksController;

  beforeEach(() => {
    service = {
      list: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 't1' }),
      getOne: jest.fn().mockResolvedValue({ id: 't1' }),
      update: jest.fn().mockResolvedValue({ id: 't1' }),
      addComment: jest.fn().mockResolvedValue({ id: 'c1' }),
    };
    controller = new TasksController(service as unknown as TasksService);
  });

  it('list delegates', async () => {
    await controller.list(user, 'p1');
    expect(service.list).toHaveBeenCalledWith(user, 'p1');
  });

  it('create delegates', async () => {
    await controller.create(user, 'p1', { title: 'T' });
    expect(service.create).toHaveBeenCalledWith(user, 'p1', { title: 'T' });
  });

  it('getOne delegates', async () => {
    await controller.getOne(user, 'p1', 't1');
    expect(service.getOne).toHaveBeenCalledWith(user, 'p1', 't1');
  });

  it('update delegates', async () => {
    await controller.update(user, 'p1', 't1', { status: 'DONE' });
    expect(service.update).toHaveBeenCalledWith(user, 'p1', 't1', {
      status: 'DONE',
    });
  });

  it('addComment delegates', async () => {
    await controller.addComment(user, 'p1', 't1', { content: 'hi' });
    expect(service.addComment).toHaveBeenCalledWith(user, 'p1', 't1', {
      content: 'hi',
    });
  });
});
