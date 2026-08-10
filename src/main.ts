import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: config.get<string>('FRONTEND_URL') ?? '*',
    credentials: true,
  });
  app.useStaticAssets(
    join(process.cwd(), config.get<string>('STORAGE_DIR') ?? 'uploads'),
    { prefix: '/uploads/' },
  );

  await app.listen(config.get<number>('PORT') ?? 3001);
}
bootstrap();
