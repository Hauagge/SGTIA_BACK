import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ProjectsModule } from '../projects/projects.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { LLM } from './llm.port';
import { OpenAiLlmProvider } from './openai-llm.provider';
import { GeminiLlmProvider } from './gemini-llm.provider';

@Module({
  imports: [ProjectsModule],
  controllers: [AiController],
  providers: [
    AiService,
    {
      provide: LLM,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get<string>('AI_DRIVER') === 'gemini'
          ? new GeminiLlmProvider(config)
          : new OpenAiLlmProvider(config),
    },
  ],
})
export class AiModule {}
