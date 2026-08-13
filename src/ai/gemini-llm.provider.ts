import { ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type } from '@google/genai';

import type { LlmProvider } from './llm.port';
import { taskDraftSchema, type TaskDraft } from './task-draft.schema';

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

const PROPERTIES = {
  type: {
    type: Type.STRING,
    enum: ['BUG', 'FEATURE', 'IMPROVEMENT', 'TECHNICAL'],
  },
  title: { type: Type.STRING },
  summary: { type: Type.STRING },
  currentBehavior: { type: Type.STRING },
  expectedBehavior: { type: Type.STRING },
  stepsToReproduce: { type: Type.STRING },
  businessRules: { type: Type.STRING },
  acceptanceCriteria: { type: Type.ARRAY, items: { type: Type.STRING } },
  suggestedPriority: { type: Type.STRING, enum: ['P0', 'P1', 'P2', 'P3'] },
  impact: { type: Type.STRING },
  missingInformation: { type: Type.ARRAY, items: { type: Type.STRING } },
  confidence: { type: Type.STRING, enum: ['HIGH', 'MEDIUM', 'LOW'] },
};

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: PROPERTIES,
  required: Object.keys(PROPERTIES),
  propertyOrdering: Object.keys(PROPERTIES),
};

export class GeminiLlmProvider implements LlmProvider {
  private readonly client: GoogleGenAI;
  readonly model: string;

  constructor(config: ConfigService) {
    this.client = new GoogleGenAI({
      apiKey: config.get<string>('GOOGLE_API_KEY'),
    });
    this.model = config.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash';
  }

  async interpret(input: string, context?: string): Promise<TaskDraft> {
    const system = context
      ? `${SYSTEM_PROMPT}\n\nContexto do projeto:\n${context}`
      : SYSTEM_PROMPT;
    try {
      const res = await this.client.models.generateContent({
        model: this.model,
        contents: input,
        config: {
          systemInstruction: system,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      });

      const text = res.text;
      if (!text) throw new Error('empty completion');
      return taskDraftSchema.parse(JSON.parse(text));
    } catch {
      throw new ServiceUnavailableException(
        'Não foi possível interpretar sua solicitação agora.',
      );
    }
  }
}
