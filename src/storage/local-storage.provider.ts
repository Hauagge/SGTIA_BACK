import { promises as fs } from 'fs';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { StorageProvider, StoredFileInput } from './storage.port';

export class LocalStorageProvider implements StorageProvider {
  private readonly dir: string;
  private readonly publicUrl: string;

  constructor(config: ConfigService) {
    this.dir = config.get<string>('STORAGE_DIR') ?? 'uploads';
    this.publicUrl =
      config.get<string>('PUBLIC_URL') ?? 'http://localhost:3001';
  }

  async save(file: StoredFileInput): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true });
    await fs.writeFile(join(this.dir, file.key), file.body);
  }

  getUrl(key: string): Promise<string> {
    return Promise.resolve(`${this.publicUrl}/uploads/${key}`);
  }

  async delete(key: string): Promise<void> {
    await fs.rm(join(this.dir, key), { force: true });
  }
}
