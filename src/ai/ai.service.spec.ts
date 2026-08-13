import { BadRequestException } from '@nestjs/common';
import { AiService } from './ai.service';
import type { ProjectsService } from '../projects/projects.service';
import type { LlmProvider } from './llm.port';
import type { TranscriptionProvider } from './transcription.port';
import type { AuthUser } from '../auth/jwt-auth.guard';
import type { TaskDraft } from './task-draft.schema';
import { createDbMock } from '../common/testing/db-mock';

const user: AuthUser = { sub: 'u1', workspaceId: 'w1', role: 'MEMBER' };

const draft: TaskDraft = {
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
  confidence: 'MEDIUM',
};

function build(project: unknown) {
  const { db } = createDbMock([]);
  const projects = {
    getOne: jest.fn().mockResolvedValue(project),
  } as unknown as ProjectsService;
  const llm = {
    model: 'o4-mini',
    interpret: jest.fn().mockResolvedValue(draft),
  } as unknown as LlmProvider;
  const transcription = {
    transcribe: jest.fn().mockResolvedValue('texto transcrito'),
  } as unknown as TranscriptionProvider;
  return {
    service: new AiService(db, llm, transcription, projects),
    projects,
    llm,
    transcription,
  };
}

function audio(overrides: Partial<{ mimetype: string; size: number }> = {}) {
  return {
    mimetype: 'audio/ogg',
    size: 1024,
    buffer: Buffer.from('x'),
    ...overrides,
  };
}

describe('AiService', () => {
  it('interprets without project context', async () => {
    const { service, projects, llm } = build({ id: 'p1', aiContext: null });
    const result = await service.interpret(user, 'p1', 'não consigo remarcar');

    expect(projects.getOne).toHaveBeenCalledWith(user, 'p1');
    expect(llm.interpret).toHaveBeenCalledWith('não consigo remarcar', undefined);
    expect(result).toEqual(draft);
  });

  it('injects the project context when present', async () => {
    const { service, llm } = build({ id: 'p1', aiContext: 'Sistema de agenda' });
    await service.interpret(user, 'p1', 'não consigo remarcar');

    expect(llm.interpret).toHaveBeenCalledWith(
      'não consigo remarcar',
      'Sistema de agenda',
    );
  });

  it('transcribes a valid audio file', async () => {
    const { service, transcription } = build({ id: 'p1' });
    const result = await service.transcribe(user, 'p1', audio());

    expect(transcription.transcribe).toHaveBeenCalledWith(
      expect.any(Buffer),
      'audio/ogg',
    );
    expect(result).toEqual({ transcription: 'texto transcrito' });
  });

  it('rejects a non-audio file', async () => {
    const { service } = build({ id: 'p1' });
    await expect(
      service.transcribe(user, 'p1', audio({ mimetype: 'image/png' })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an audio file over the size limit', async () => {
    const { service } = build({ id: 'p1' });
    await expect(
      service.transcribe(user, 'p1', audio({ size: 26 * 1024 * 1024 })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
