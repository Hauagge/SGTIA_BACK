import { Inject, Injectable } from '@nestjs/common';

import { DRIZZLE } from '../database/drizzle.constants';
import type { DrizzleDB } from '../database/drizzle.module';
import { aiInterpretations } from '../database/schema';
import type { AuthUser } from '../auth/jwt-auth.guard';
import { ProjectsService } from '../projects/projects.service';
import { LLM, type LlmProvider } from './llm.port';
import type { TaskDraft } from './task-draft.schema';

@Injectable()
export class AiService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    @Inject(LLM) private readonly llm: LlmProvider,
    private readonly projects: ProjectsService,
  ) {}

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
