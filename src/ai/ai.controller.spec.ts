import { BadRequestException } from '@nestjs/common';
import { AiController } from './ai.controller';
import type { AiService, AudioFile } from './ai.service';
import type { AuthUser } from '../auth/jwt-auth.guard';

const user: AuthUser = { sub: 'u1', workspaceId: 'w1', role: 'MEMBER' };

const file: AudioFile = {
  mimetype: 'audio/ogg',
  size: 1024,
  buffer: Buffer.from('x'),
};

describe('AiController', () => {
  it('delegates interpret to the service', () => {
    const ai = {
      interpret: jest.fn().mockReturnValue('draft'),
    } as unknown as AiService;
    const controller = new AiController(ai);

    const result = controller.interpret(user, 'p1', { source: 'texto livre' });

    expect(ai.interpret).toHaveBeenCalledWith(user, 'p1', 'texto livre');
    expect(result).toBe('draft');
  });

  it('delegates transcribe to the service', () => {
    const ai = {
      transcribe: jest.fn().mockReturnValue({ transcription: 'oi' }),
    } as unknown as AiService;
    const controller = new AiController(ai);

    const result = controller.transcribe(user, 'p1', file);

    expect(ai.transcribe).toHaveBeenCalledWith(user, 'p1', file);
    expect(result).toEqual({ transcription: 'oi' });
  });

  it('rejects transcribe without a file', () => {
    const ai = { transcribe: jest.fn() } as unknown as AiService;
    const controller = new AiController(ai);

    expect(() =>
      controller.transcribe(user, 'p1', undefined as unknown as AudioFile),
    ).toThrow(BadRequestException);
  });
});
