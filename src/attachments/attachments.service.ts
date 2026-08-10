import { randomUUID } from 'crypto';
import { extname } from 'path';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { DRIZZLE } from '../database/drizzle.constants';
import type { DrizzleDB } from '../database/drizzle.module';
import { attachments, tasks, type Attachment } from '../database/schema';
import { STORAGE, type StorageProvider } from '../storage/storage.port';
import { ProjectsService } from '../projects/projects.service';
import type { AuthUser } from '../auth/jwt-auth.guard';

const MAX_SIZE = 25 * 1024 * 1024;
const ALLOWED_PREFIXES = [/^image\//, /^video\//, /^audio\//];
const ALLOWED_EXACT = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

function isAllowed(mime: string): boolean {
  return (
    ALLOWED_PREFIXES.some((re) => re.test(mime)) || ALLOWED_EXACT.has(mime)
  );
}

export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class AttachmentsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    @Inject(STORAGE) private readonly storage: StorageProvider,
    private readonly projects: ProjectsService,
  ) {}

  async upload(
    user: AuthUser,
    projectId: string,
    taskId: string,
    file: UploadedFile,
  ) {
    await this.ensureTask(user, projectId, taskId);
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('Arquivo excede o limite de 25MB');
    }
    if (!isAllowed(file.mimetype)) {
      throw new BadRequestException('Tipo de arquivo não suportado');
    }

    const key = `${randomUUID()}${extname(file.originalname)}`;
    await this.storage.save({
      key,
      body: file.buffer,
      contentType: file.mimetype,
    });

    const [row] = await this.db
      .insert(attachments)
      .values({
        taskId,
        userId: user.sub,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storageKey: key,
      })
      .returning();
    return this.toDto(row);
  }

  async list(user: AuthUser, projectId: string, taskId: string) {
    await this.ensureTask(user, projectId, taskId);
    const rows = await this.db
      .select()
      .from(attachments)
      .where(eq(attachments.taskId, taskId))
      .orderBy(asc(attachments.createdAt));
    return Promise.all(rows.map((row) => this.toDto(row)));
  }

  async remove(
    user: AuthUser,
    projectId: string,
    taskId: string,
    attachmentId: string,
  ) {
    await this.ensureTask(user, projectId, taskId);
    const [row] = await this.db
      .select()
      .from(attachments)
      .where(
        and(eq(attachments.id, attachmentId), eq(attachments.taskId, taskId)),
      )
      .limit(1);
    if (!row) throw new NotFoundException();

    await this.storage.delete(row.storageKey);
    await this.db.delete(attachments).where(eq(attachments.id, attachmentId));
    return { ok: true };
  }

  private async ensureTask(user: AuthUser, projectId: string, taskId: string) {
    await this.projects.getOne(user, projectId);
    const [task] = await this.db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.projectId, projectId)))
      .limit(1);
    if (!task) throw new NotFoundException();
  }

  private async toDto(row: Attachment) {
    return {
      id: row.id,
      fileName: row.fileName,
      mimeType: row.mimeType,
      size: row.size,
      url: await this.storage.getUrl(row.storageKey),
      createdAt: row.createdAt,
    };
  }
}
