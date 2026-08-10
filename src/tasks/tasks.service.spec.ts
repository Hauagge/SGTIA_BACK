import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import type { ProjectsService } from '../projects/projects.service';
import type { AuthUser } from '../auth/jwt-auth.guard';
import { createDbMock } from '../common/testing/db-mock';

const user: AuthUser = { sub: 'u1', workspaceId: 'w1', role: 'MEMBER' };
const baseTask = {
  id: 't1',
  workspaceId: 'w1',
  projectId: 'p1',
  number: 1,
  title: 'T',
  type: 'BUG',
  status: 'BACKLOG',
  priority: 'P2',
  description: '',
  currentBehavior: '',
  expectedBehavior: '',
  impact: '',
  assigneeId: null,
  createdById: 'u1',
  createdAt: new Date(),
  updatedAt: new Date(),
  completedAt: null,
};

function service(queue: unknown[]) {
  const { db } = createDbMock(queue);
  const projects = {
    getOne: jest.fn().mockResolvedValue({ id: 'p1' }),
  } as unknown as ProjectsService;
  return new TasksService(db, projects);
}

describe('TasksService', () => {
  it('list returns summaries', async () => {
    const rows = [{ id: 't1', number: 1, commentCount: 0 }];
    const result = await service([rows]).list(user, 'p1');
    expect(result).toEqual(rows);
  });

  it('create with criteria and assignee', async () => {
    const result = await service([
      [{ next: 1 }],
      [baseTask],
      undefined,
      undefined,
      [baseTask],
      [],
      [],
      [],
    ]).create(user, 'p1', {
      title: 'T',
      type: 'BUG',
      priority: 'P1',
      assigneeId: 'u2',
      acceptanceCriteria: ['a', 'b'],
    });
    expect(result.id).toBe('t1');
    expect(result.acceptanceCriteria).toEqual([]);
  });

  it('create minimal without criteria', async () => {
    const result = await service([
      [{ next: 2 }],
      [baseTask],
      undefined,
      [baseTask],
      [],
      [],
      [],
    ]).create(user, 'p1', { title: 'T' });
    expect(result.id).toBe('t1');
  });

  it('getOne with assignee resolves name', async () => {
    const withAssignee = { ...baseTask, assigneeId: 'u2' };
    const result = await service([
      [withAssignee],
      [{ id: 'c1', description: 'crit', completed: false, position: 0 }],
      [{ id: 'm1', author: 'Ana', content: 'oi' }],
      [{ id: 'h1', author: 'Ana', action: 'Criou a tarefa' }],
      [{ name: 'Bob' }],
    ]).getOne(user, 'p1', 't1');
    expect(result.assigneeName).toBe('Bob');
    expect(result.acceptanceCriteria).toHaveLength(1);
    expect(result.comments).toHaveLength(1);
  });

  it('getOne throws when task missing', async () => {
    await expect(service([[]]).getOne(user, 'p1', 't1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('update changes status/priority/assignee and completes', async () => {
    const result = await service([
      [baseTask],
      undefined,
      undefined,
      [{ ...baseTask, status: 'DONE' }],
      [],
      [],
      [],
    ]).update(user, 'p1', 't1', {
      title: 'X',
      type: 'FEATURE',
      description: 'd',
      currentBehavior: 'c',
      expectedBehavior: 'e',
      impact: 'i',
      status: 'DONE',
      priority: 'P0',
      assigneeId: 'u2',
    });
    expect(result.status).toBe('DONE');
  });

  it('update status to non-DONE clears completion', async () => {
    const result = await service([
      [baseTask],
      undefined,
      undefined,
      [{ ...baseTask, status: 'ANALYSIS' }],
      [],
      [],
      [],
    ]).update(user, 'p1', 't1', { status: 'ANALYSIS' });
    expect(result.status).toBe('ANALYSIS');
  });

  it('update with no real change skips history', async () => {
    const result = await service([
      [baseTask],
      undefined,
      [baseTask],
      [],
      [],
      [],
    ]).update(user, 'p1', 't1', {
      status: 'BACKLOG',
      priority: 'P2',
      assigneeId: null,
    });
    expect(result.id).toBe('t1');
  });

  it('update throws when task missing', async () => {
    await expect(
      service([[]]).update(user, 'p1', 't1', { title: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('addComment inserts and returns comment', async () => {
    const comment = { id: 'c1', content: 'hi' };
    const result = await service([[{ id: 't1' }], [comment]]).addComment(
      user,
      'p1',
      't1',
      { content: 'hi' },
    );
    expect(result).toEqual(comment);
  });

  it('addComment throws when task missing', async () => {
    await expect(
      service([[]]).addComment(user, 'p1', 't1', { content: 'hi' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
