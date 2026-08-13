import { ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

import type { TranscriptionProvider } from './transcription.port';

const INSTRUCTION =
  'Transcreva este áudio em português. Responda apenas com o texto falado, sem comentários nem formatação.';

export class GeminiTranscriptionProvider implements TranscriptionProvider {
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(config: ConfigService) {
    this.client = new GoogleGenAI({
      apiKey: config.get<string>('GOOGLE_API_KEY'),
    });
    this.model = config.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash';
  }

  async transcribe(audio: Buffer, mimeType: string): Promise<string> {
    try {
      const res = await this.client.models.generateContent({
        model: this.model,
        contents: [
          { inlineData: { mimeType, data: audio.toString('base64') } },
          { text: INSTRUCTION },
        ],
      });

      const text = res.text;
      if (!text) throw new Error('empty transcription');
      return text.trim();
    } catch {
      throw new ServiceUnavailableException(
        'Não foi possível transcrever o áudio agora.',
      );
    }
  }
}
