import {
  addMemberSchema,
  createProjectSchema,
  updateProjectSchema,
} from './project.dto';

describe('project dto', () => {
  it('createProjectSchema accepts valid input', () => {
    expect(createProjectSchema.parse({ name: 'AgendouAI' })).toEqual({
      name: 'AgendouAI',
    });
  });

  it('updateProjectSchema rejects empty object', () => {
    expect(() => updateProjectSchema.parse({})).toThrow();
  });

  it('updateProjectSchema accepts a single field', () => {
    expect(updateProjectSchema.parse({ name: 'Novo' })).toEqual({
      name: 'Novo',
    });
  });

  it('addMemberSchema requires uuid', () => {
    expect(() => addMemberSchema.parse({ userId: 'not-uuid' })).toThrow();
    expect(
      addMemberSchema.parse({
        userId: '11111111-1111-4111-8111-111111111111',
      }),
    ).toBeDefined();
  });
});
