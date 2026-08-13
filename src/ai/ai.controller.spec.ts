import { AiController } from './ai.controller';
import type { AiService } from './ai.service';
import type { AuthUser } from '../auth/jwt-auth.guard';

const user: AuthUser = { sub: 'u1', workspaceId: 'w1', role: 'MEMBER' };

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
});
