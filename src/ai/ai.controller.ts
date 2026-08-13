import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { CurrentUser } from '../auth/current-user.decorator';
import { type AuthUser } from '../auth/jwt-auth.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AiService, type AudioFile } from './ai.service';
import { interpretSchema, type InterpretInput } from './dto/ai.dto';

@Controller('projects/:projectId/ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('interpret')
  interpret(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body(new ZodValidationPipe(interpretSchema)) body: InterpretInput,
  ) {
    return this.ai.interpret(user, projectId, body.source);
  }

  @Post('transcribe')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024 } }),
  )
  transcribe(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @UploadedFile() file: AudioFile,
  ) {
    if (!file) throw new BadRequestException('Arquivo obrigatório');
    return this.ai.transcribe(user, projectId, file);
  }
}
