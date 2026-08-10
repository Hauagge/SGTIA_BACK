import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AttachmentsService, type UploadedFile } from './attachments.service';
import type { ProjectsService } from '../projects/projects.service';
import type { StorageProvider } from '../storage/storage.port';
import type { AuthUser } from '../auth/jwt-auth.guard';
import { createDbMock } from '../common/testing/db-mock';

const user: AuthUser = { sub: 'u1', workspaceId: 'w1', role: 'MEMBER' };
const attRow = {
  id: 'a1',
  taskId: 't1',
  userId: 'u1',
  fileName: 'foto.png',
  mimeType: 'image/png',
  size: 100,
  storageKey: 'k.png',
  createdAt: new Date(),
};

function makeFile(overrides: Partial<UploadedFile> = {}): UploadedFile {
  return {
    originalname: 'foto.png',
    mimetype: 'image/png',
    size: 100,
    buffer: Buffer.from('x'),
    ...overrides,
  };
}

function setup(queue: unknown[]) {
  const { db } = createDbMock(queue);
  const storage = {
    save: jest.fn().mockResolvedValue(undefined),
    getUrl: jest.fn().mockResolvedValue('http://url/k.png'),
    delete: jest.fn().mockResolvedValue(undefined),
  } satisfies StorageProvider as jest.Mocked<StorageProvider>;
  const projects = {
    getOne: jest.fn().mockResolvedValue({ id: 'p1' }),
  } as unknown as ProjectsService;
  return { service: new AttachmentsService(db, storage, projects), storage };
}

describe('AttachmentsService', () => {
  it('uploads an image', async () => {
    const { service, storage } = setup([[{ id: 't1' }], [attRow]]);
    const result = await service.upload(user, 'p1', 't1', makeFile());
    expect(storage.save).toHaveBeenCalled();
    expect(result).toMatchObject({
      fileName: 'foto.png',
      url: 'http://url/k.png',
    });
  });

  it('uploads a pdf (exact allowed type)', async () => {
    const { service } = setup([[{ id: 't1' }], [attRow]]);
    const result = await service.upload(
      user,
      'p1',
      't1',
      makeFile({ mimetype: 'application/pdf', originalname: 'doc.pdf' }),
    );
    expect(result.id).toBe('a1');
  });

  it('rejects task not found', async () => {
    const { service } = setup([[]]);
    await expect(
      service.upload(user, 'p1', 't1', makeFile()),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects files over the size limit', async () => {
    const { service, storage } = setup([[{ id: 't1' }]]);
    await expect(
      service.upload(user, 'p1', 't1', makeFile({ size: 26 * 1024 * 1024 })),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('rejects unsupported mime types', async () => {
    const { service } = setup([[{ id: 't1' }]]);
    await expect(
      service.upload(
        user,
        'p1',
        't1',
        makeFile({ mimetype: 'application/x-msdownload' }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists attachments', async () => {
    const { service } = setup([[{ id: 't1' }], [attRow]]);
    const result = await service.list(user, 'p1', 't1');
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('http://url/k.png');
  });

  it('removes an attachment', async () => {
    const { service, storage } = setup([[{ id: 't1' }], [attRow], undefined]);
    const result = await service.remove(user, 'p1', 't1', 'a1');
    expect(storage.delete).toHaveBeenCalledWith('k.png');
    expect(result).toEqual({ ok: true });
  });

  it('remove throws when attachment missing', async () => {
    const { service } = setup([[{ id: 't1' }], []]);
    await expect(service.remove(user, 'p1', 't1', 'a1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
