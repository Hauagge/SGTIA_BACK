import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  AttachmentsService,
  type UploadedFile as File,
} from './attachments.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { type AuthUser } from '../auth/jwt-auth.guard';

@Controller('projects/:projectId/tasks/:taskId/attachments')
export class AttachmentsController {
  constructor(private readonly attachments: AttachmentsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.attachments.list(user, projectId, taskId);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024 } }),
  )
  upload(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @UploadedFile() file: File,
  ) {
    if (!file) throw new BadRequestException('Arquivo obrigatório');
    return this.attachments.upload(user, projectId, taskId, file);
  }

  @Delete(':attachmentId')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.attachments.remove(user, projectId, taskId, attachmentId);
  }
}
