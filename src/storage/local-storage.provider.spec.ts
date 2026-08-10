import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import type { ConfigService } from '@nestjs/config';
import { LocalStorageProvider } from './local-storage.provider';

function makeProvider(dir: string) {
  const config = {
    get: (key: string) =>
      key === 'STORAGE_DIR' ? dir : 'http://localhost:3001',
  } as unknown as ConfigService;
  return new LocalStorageProvider(config);
}

describe('LocalStorageProvider', () => {
  const dir = join(tmpdir(), `sgtia-storage-${process.pid}`);

  afterAll(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('saves, exposes a url and deletes', async () => {
    const provider = makeProvider(dir);
    await provider.save({
      key: 'file.txt',
      body: Buffer.from('hello'),
      contentType: 'text/plain',
    });
    const content = await fs.readFile(join(dir, 'file.txt'), 'utf8');
    expect(content).toBe('hello');

    const url = await provider.getUrl('file.txt');
    expect(url).toBe('http://localhost:3001/uploads/file.txt');

    await provider.delete('file.txt');
    await expect(fs.readFile(join(dir, 'file.txt'))).rejects.toBeDefined();
  });

  it('falls back to defaults when config is empty', async () => {
    const config = {
      get: () => undefined,
    } as unknown as ConfigService;
    const provider = new LocalStorageProvider(config);
    expect(await provider.getUrl('k')).toBe('http://localhost:3001/uploads/k');
  });
});
