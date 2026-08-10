import {
  addCommentSchema,
  createTaskSchema,
  updateTaskSchema,
} from './task.dto';

describe('task dto', () => {
  it('createTaskSchema accepts minimal input', () => {
    expect(createTaskSchema.parse({ title: 'Erro' })).toEqual({
      title: 'Erro',
    });
  });

  it('createTaskSchema accepts full input', () => {
    const input = {
      title: 'Erro',
      type: 'BUG' as const,
      priority: 'P1' as const,
      acceptanceCriteria: ['a'],
      assigneeId: '11111111-1111-4111-8111-111111111111',
    };
    expect(createTaskSchema.parse(input)).toMatchObject({ title: 'Erro' });
  });

  it('updateTaskSchema rejects empty object', () => {
    expect(() => updateTaskSchema.parse({})).toThrow();
  });

  it('updateTaskSchema accepts a status change', () => {
    expect(updateTaskSchema.parse({ status: 'DONE' })).toEqual({
      status: 'DONE',
    });
  });

  it('addCommentSchema requires content', () => {
    expect(() => addCommentSchema.parse({ content: '' })).toThrow();
    expect(addCommentSchema.parse({ content: 'oi' })).toEqual({
      content: 'oi',
    });
  });
});
