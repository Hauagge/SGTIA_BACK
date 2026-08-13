import { ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

import type { LlmProvider } from './llm.port';
import {
  taskDraftJsonSchema,
  taskDraftSchema,
  type TaskDraft,
} from './task-draft.schema';

const SYSTEM_PROMPT = [
  'Você interpreta uma solicitação livre de um usuário não técnico e a transforma',
  'em um rascunho de tarefa estruturado para um desenvolvedor.',
  'Classifique o tipo entre BUG, FEATURE, IMPROVEMENT ou TECHNICAL e sugira uma',
  'prioridade entre P0 e P3.',
  'Não invente regras de negócio, ambiente, navegador ou impacto.',
  'Não transforme suposição em fato.',
  'Tudo que for importante e não foi informado deve ir para missingInformation',
  'como perguntas curtas.',
  'Defina confidence como LOW quando faltar informação essencial.',
  'Responda sempre em português.',
].join(' ');

export class OpenAiLlmProvider implements LlmProvider {
  private readonly client: OpenAI;
  readonly model: string;

  constructor(config: ConfigService) {
    this.client = new OpenAI({ apiKey: config.get<string>('OPENAI_API_KEY') });
    this.model = config.get<string>('AI_MODEL') ?? 'o4-mini';
  }

  async interpret(input: string, context?: string): Promise<TaskDraft> {
    const system = context
      ? `${SYSTEM_PROMPT}\n\nContexto do projeto:\n${context}`
      : SYSTEM_PROMPT;
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: input },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'task_draft',
            strict: true,
            schema: taskDraftJsonSchema,
          },
        },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('empty completion');
      return taskDraftSchema.parse(JSON.parse(content));
    } catch {
      throw new ServiceUnavailableException(
        'Não foi possível interpretar sua solicitação agora.',
      );
    }
  }
}
