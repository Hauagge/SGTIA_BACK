import { z } from 'zod';

export const taskDraftSchema = z.object({
  type: z.enum(['BUG', 'FEATURE', 'IMPROVEMENT', 'TECHNICAL']),
  title: z.string().min(3),
  summary: z.string(),
  currentBehavior: z.string(),
  expectedBehavior: z.string(),
  stepsToReproduce: z.string(),
  businessRules: z.string(),
  acceptanceCriteria: z.array(z.string()),
  suggestedPriority: z.enum(['P0', 'P1', 'P2', 'P3']),
  impact: z.string(),
  missingInformation: z.array(z.string()),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
});

export type TaskDraft = z.infer<typeof taskDraftSchema>;

export const taskDraftJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    type: {
      type: 'string',
      enum: ['BUG', 'FEATURE', 'IMPROVEMENT', 'TECHNICAL'],
    },
    title: { type: 'string' },
    summary: { type: 'string' },
    currentBehavior: { type: 'string' },
    expectedBehavior: { type: 'string' },
    stepsToReproduce: { type: 'string' },
    businessRules: { type: 'string' },
    acceptanceCriteria: { type: 'array', items: { type: 'string' } },
    suggestedPriority: { type: 'string', enum: ['P0', 'P1', 'P2', 'P3'] },
    impact: { type: 'string' },
    missingInformation: { type: 'array', items: { type: 'string' } },
    confidence: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
  },
  required: [
    'type',
    'title',
    'summary',
    'currentBehavior',
    'expectedBehavior',
    'stepsToReproduce',
    'businessRules',
    'acceptanceCriteria',
    'suggestedPriority',
    'impact',
    'missingInformation',
    'confidence',
  ],
};
