import { z } from 'zod';

const taskType = z.enum(['BUG', 'FEATURE', 'IMPROVEMENT', 'TECHNICAL']);
const taskStatus = z.enum([
  'BACKLOG',
  'ANALYSIS',
  'READY',
  'IN_PROGRESS',
  'VALIDATION',
  'DONE',
]);
const priority = z.enum(['P0', 'P1', 'P2', 'P3']);

export const createTaskSchema = z.object({
  title: z.string().min(2),
  type: taskType.optional(),
  priority: priority.optional(),
  description: z.string().optional(),
  currentBehavior: z.string().optional(),
  expectedBehavior: z.string().optional(),
  impact: z.string().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  acceptanceCriteria: z.array(z.string()).optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().min(2).optional(),
    type: taskType.optional(),
    status: taskStatus.optional(),
    priority: priority.optional(),
    description: z.string().optional(),
    currentBehavior: z.string().optional(),
    expectedBehavior: z.string().optional(),
    impact: z.string().optional(),
    assigneeId: z.string().uuid().nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: 'Nenhum campo para atualizar',
  });

export const addCommentSchema = z.object({
  content: z.string().min(1),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type AddCommentInput = z.infer<typeof addCommentSchema>;
