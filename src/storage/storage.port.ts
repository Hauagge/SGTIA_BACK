export const STORAGE = Symbol('STORAGE');

export interface StoredFileInput {
  key: string;
  body: Buffer;
  contentType: string;
}

export interface StorageProvider {
  save(file: StoredFileInput): Promise<void>;
  getUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
}
