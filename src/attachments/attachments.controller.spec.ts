import { BadRequestException } from '@nestjs/common';
import { AttachmentsController } from './attachments.controller';
import type { AttachmentsService, UploadedFile } from './attachments.service';
import type { AuthUser } from '../auth/jwt-auth.guard';

const user: AuthUser = { sub: 'u1', workspaceId: 'w1', role: 'MEMBER' };
const file: UploadedFile = {
  originalname: 'foto.png',
  mimetype: 'image/png',
  size: 100,
  buffer: Buffer.from('x'),
};

describe('AttachmentsController', () => {
  let service: jest.Mocked<
    Pick<AttachmentsService, 'list' | 'upload' | 'remove'>
  >;
  let controller: AttachmentsController;

  beforeEach(() => {
    service = {
      list: jest.fn().mockResolvedValue([]),
      upload: jest.fn().mockResolvedValue({ id: 'a1' }),
      remove: jest.fn().mockResolvedValue({ ok: true }),
    };
    controller = new AttachmentsController(
      service as unknown as AttachmentsService,
    );
  });

  it('list delegates', async () => {
    await controller.list(user, 'p1', 't1');
    expect(service.list).toHaveBeenCalledWith(user, 'p1', 't1');
  });

  it('upload delegates', async () => {
    await controller.upload(user, 'p1', 't1', file);
    expect(service.upload).toHaveBeenCalledWith(user, 'p1', 't1', file);
  });

  it('upload without file throws', () => {
    expect(() =>
      controller.upload(user, 'p1', 't1', undefined as unknown as UploadedFile),
    ).toThrow(BadRequestException);
  });

  it('remove delegates', async () => {
    await controller.remove(user, 'p1', 't1', 'a1');
    expect(service.remove).toHaveBeenCalledWith(user, 'p1', 't1', 'a1');
  });
});
