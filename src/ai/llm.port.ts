import type { TaskDraft } from './task-draft.schema';

export const LLM = Symbol('LLM');

export interface LlmProvider {
  readonly model: string;
  interpret(input: string, context?: string): Promise<TaskDraft>;
}
