import { taskDraftJsonSchema, taskDraftSchema } from './task-draft.schema';

const validDraft = {
  type: 'BUG',
  title: 'Erro ao remarcar',
  summary: '',
  currentBehavior: '',
  expectedBehavior: '',
  stepsToReproduce: '',
  businessRules: '',
  acceptanceCriteria: [],
  suggestedPriority: 'P1',
  impact: '',
  missingInformation: [],
  confidence: 'LOW',
};

describe('taskDraftSchema', () => {
  it('parses a valid draft', () => {
    expect(taskDraftSchema.parse(validDraft)).toEqual(validDraft);
  });

  it('rejects an invalid type', () => {
    expect(taskDraftSchema.safeParse({ ...validDraft, type: 'X' }).success).toBe(
      false,
    );
  });

  it('exposes a json schema listing every required field', () => {
    expect(taskDraftJsonSchema.required).toEqual(
      Object.keys(taskDraftJsonSchema.properties),
    );
  });
});
