import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { DRIZZLE } from '../database/drizzle.constants';
import type { DrizzleDB } from '../database/drizzle.module';
import { aiInterpretations } from '../database/schema';
import type { AuthUser } from '../auth/jwt-auth.guard';
import { ProjectsService } from '../projects/projects.service';
import { LLM, type LlmProvider } from './llm.port';
import {
  TRANSCRIPTION,
  type TranscriptionProvider,
} from './transcription.port';
import type { TaskDraft } from './task-draft.schema';

const MAX_AUDIO_SIZE = 25 * 1024 * 1024;

export interface AudioFile {
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class AiService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    @Inject(LLM) private readonly llm: LlmProvider,
    @Inject(TRANSCRIPTION)
    private readonly transcription: TranscriptionProvider,
    private readonly projects: ProjectsService,
  ) {}

  async transcribe(
    user: AuthUser,
    projectId: string,
    file: AudioFile,
  ): Promise<{ transcription: string }> {
    await this.projects.getOne(user, projectId);
    if (!file.mimetype.startsWith('audio/')) {
      throw new BadRequestException('Envie um arquivo de áudio');
    }
    if (file.size > MAX_AUDIO_SIZE) {
      throw new BadRequestException('Áudio excede o limite de 25MB');
    }
    const transcription = await this.transcription.transcribe(
      file.buffer,
      file.mimetype,
    );
    return { transcription };
  }

  async interpret(
    user: AuthUser,
    projectId: string,
    source: string,
  ): Promise<TaskDraft> {
    const project = await this.projects.getOne(user, projectId);
    const draft = await this.llm.interpret(
      source,
      project.aiContext ?? undefined,
    );
    await this.db.insert(aiInterpretations).values({
      workspaceId: user.workspaceId,
      projectId,
      source: 'TEXT',
      originalInput: source,
      draftJson: JSON.stringify(draft),
      model: this.llm.model,
      confidence: draft.confidence,
    });
    return draft;
  }
}
