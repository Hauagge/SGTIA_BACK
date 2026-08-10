import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';

import { DRIZZLE } from '../database/drizzle.constants';
import type { DrizzleDB } from '../database/drizzle.module';
import {
  acceptanceCriteria,
  comments,
  taskHistory,
  tasks,
  users,
} from '../database/schema';
import type { AuthUser } from '../auth/jwt-auth.guard';
import { ProjectsService } from '../projects/projects.service';
import type {
  AddCommentInput,
  CreateTaskInput,
  UpdateTaskInput,
} from './dto/task.dto';

@Injectable()
export class TasksService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly projects: ProjectsService,
  ) {}

  async list(user: AuthUser, projectId: string) {
    await this.projects.getOne(user, projectId);
    return this.db
      .select({
        id: tasks.id,
        number: tasks.number,
        title: tasks.title,
        type: tasks.type,
        status: tasks.status,
        priority: tasks.priority,
        assigneeName: users.name,
        commentCount: sql<number>`(select count(*)::int from ${comments} where ${comments.taskId} = ${tasks.id})`,
        attachmentCount: sql<number>`0`,
      })
      .from(tasks)
      .leftJoin(users, eq(users.id, tasks.assigneeId))
      .where(eq(tasks.projectId, projectId))
      .orderBy(asc(tasks.number));
  }

  async create(user: AuthUser, projectId: string, input: CreateTaskInput) {
    await this.projects.getOne(user, projectId);
    const task = await this.db.transaction(async (tx) => {
      const [{ next }] = await tx
        .select({
          next: sql<number>`coalesce(max(${tasks.number}), 0) + 1`,
        })
        .from(tasks)
        .where(eq(tasks.projectId, projectId));

      const [created] = await tx
        .insert(tasks)
        .values({
          workspaceId: user.workspaceId,
          projectId,
          number: next,
          title: input.title,
          type: input.type ?? 'FEATURE',
          priority: input.priority ?? 'P2',
          description: input.description ?? '',
          currentBehavior: input.currentBehavior ?? '',
          expectedBehavior: input.expectedBehavior ?? '',
          impact: input.impact ?? '',
          assigneeId: input.assigneeId ?? null,
          createdById: user.sub,
        })
        .returning();

      if (input.acceptanceCriteria && input.acceptanceCriteria.length > 0) {
        await tx.insert(acceptanceCriteria).values(
          input.acceptanceCriteria.map((description, position) => ({
            taskId: created.id,
            description,
            position,
          })),
        );
      }

      await tx.insert(taskHistory).values({
        taskId: created.id,
        userId: user.sub,
        action: 'Criou a tarefa',
      });

      return created;
    });

    return this.getOne(user, projectId, task.id);
  }

  async getOne(user: AuthUser, projectId: string, taskId: string) {
    await this.projects.getOne(user, projectId);
    const [task] = await this.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.projectId, projectId)))
      .limit(1);
    if (!task) throw new NotFoundException();

    const criteria = await this.db
      .select()
      .from(acceptanceCriteria)
      .where(eq(acceptanceCriteria.taskId, taskId))
      .orderBy(asc(acceptanceCriteria.position));

    const taskComments = await this.db
      .select({
        id: comments.id,
        author: users.name,
        content: comments.content,
        createdAt: comments.createdAt,
      })
      .from(comments)
      .innerJoin(users, eq(users.id, comments.userId))
      .where(eq(comments.taskId, taskId))
      .orderBy(asc(comments.createdAt));

    const history = await this.db
      .select({
        id: taskHistory.id,
        author: users.name,
        action: taskHistory.action,
        createdAt: taskHistory.createdAt,
      })
      .from(taskHistory)
      .leftJoin(users, eq(users.id, taskHistory.userId))
      .where(eq(taskHistory.taskId, taskId))
      .orderBy(asc(taskHistory.createdAt));

    let assigneeName: string | null = null;
    if (task.assigneeId) {
      const [assignee] = await this.db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, task.assigneeId))
        .limit(1);
      assigneeName = assignee?.name ?? null;
    }

    return {
      ...task,
      assigneeName,
      acceptanceCriteria: criteria,
      comments: taskComments,
      history,
      attachments: [],
    };
  }

  async update(
    user: AuthUser,
    projectId: string,
    taskId: string,
    input: UpdateTaskInput,
  ) {
    await this.projects.getOne(user, projectId);
    const [existing] = await this.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.projectId, projectId)))
      .limit(1);
    if (!existing) throw new NotFoundException();

    const set: Record<string, unknown> = { updatedAt: new Date() };
    const changes: { action: string; oldValue: string; newValue: string }[] =
      [];

    if (input.title !== undefined) set.title = input.title;
    if (input.type !== undefined) set.type = input.type;
    if (input.description !== undefined) set.description = input.description;
    if (input.currentBehavior !== undefined) {
      set.currentBehavior = input.currentBehavior;
    }
    if (input.expectedBehavior !== undefined) {
      set.expectedBehavior = input.expectedBehavior;
    }
    if (input.impact !== undefined) set.impact = input.impact;

    if (input.status !== undefined && input.status !== existing.status) {
      set.status = input.status;
      set.completedAt = input.status === 'DONE' ? new Date() : null;
      changes.push({
        action: 'Mudou o status',
        oldValue: existing.status,
        newValue: input.status,
      });
    }
    if (input.priority !== undefined && input.priority !== existing.priority) {
      set.priority = input.priority;
      changes.push({
        action: 'Mudou a prioridade',
        oldValue: existing.priority,
        newValue: input.priority,
      });
    }
    if (
      input.assigneeId !== undefined &&
      input.assigneeId !== existing.assigneeId
    ) {
      set.assigneeId = input.assigneeId;
      changes.push({
        action: 'Alterou o responsável',
        oldValue: existing.assigneeId ?? '',
        newValue: input.assigneeId ?? '',
      });
    }

    await this.db.transaction(async (tx) => {
      await tx.update(tasks).set(set).where(eq(tasks.id, taskId));
      if (changes.length > 0) {
        await tx.insert(taskHistory).values(
          changes.map((c) => ({
            taskId,
            userId: user.sub,
            action: c.action,
            oldValue: c.oldValue,
            newValue: c.newValue,
          })),
        );
      }
    });

    return this.getOne(user, projectId, taskId);
  }

  async addComment(
    user: AuthUser,
    projectId: string,
    taskId: string,
    input: AddCommentInput,
  ) {
    await this.projects.getOne(user, projectId);
    const [task] = await this.db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.projectId, projectId)))
      .limit(1);
    if (!task) throw new NotFoundException();

    const [created] = await this.db
      .insert(comments)
      .values({ taskId, userId: user.sub, content: input.content })
      .returning();
    return created;
  }
}
