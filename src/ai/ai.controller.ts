import { Body, Controller, Param, Post } from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { type AuthUser } from '../auth/jwt-auth.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AiService } from './ai.service';
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
}
