import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import {
  addCommentSchema,
  createTaskSchema,
  updateTaskSchema,
} from './dto/task.dto';
import type {
  AddCommentInput,
  CreateTaskInput,
  UpdateTaskInput,
} from './dto/task.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { type AuthUser } from '../auth/jwt-auth.guard';

@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string) {
    return this.tasks.list(user, projectId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body(new ZodValidationPipe(createTaskSchema)) body: CreateTaskInput,
  ) {
    return this.tasks.create(user, projectId, body);
  }

  @Get(':taskId')
  getOne(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.tasks.getOne(user, projectId, taskId);
  }

  @Patch(':taskId')
  update(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body(new ZodValidationPipe(updateTaskSchema)) body: UpdateTaskInput,
  ) {
    return this.tasks.update(user, projectId, taskId, body);
  }

  @Post(':taskId/comments')
  addComment(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body(new ZodValidationPipe(addCommentSchema)) body: AddCommentInput,
  ) {
    return this.tasks.addComment(user, projectId, taskId, body);
  }
}
