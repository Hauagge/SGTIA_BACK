import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STORAGE } from './storage.port';
import { LocalStorageProvider } from './local-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';

@Global()
@Module({
  providers: [
    {
      provide: STORAGE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get<string>('STORAGE_DRIVER') === 's3'
          ? new S3StorageProvider(config)
          : new LocalStorageProvider(config),
    },
  ],
  exports: [STORAGE],
})
export class StorageModule {}
