import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE } from '../database/drizzle.constants';
import type { DrizzleDB } from '../database/drizzle.module';
import { projectMembers, projects, users } from '../database/schema';
import type { AuthUser } from '../auth/jwt-auth.guard';
import type {
  AddMemberInput,
  CreateProjectInput,
  UpdateProjectInput,
} from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async list(user: AuthUser) {
    if (user.role === 'ADMIN') {
      return this.db
        .select()
        .from(projects)
        .where(eq(projects.workspaceId, user.workspaceId));
    }
    return this.db
      .select({
        id: projects.id,
        workspaceId: projects.workspaceId,
        name: projects.name,
        description: projects.description,
        active: projects.active,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .innerJoin(projectMembers, eq(projectMembers.projectId, projects.id))
      .where(
        and(
          eq(projects.workspaceId, user.workspaceId),
          eq(projectMembers.userId, user.sub),
        ),
      );
  }

  async create(user: AuthUser, input: CreateProjectInput) {
    return this.db.transaction(async (tx) => {
      const [project] = await tx
        .insert(projects)
        .values({
          workspaceId: user.workspaceId,
          name: input.name,
          description: input.description,
        })
        .returning();
      await tx.insert(projectMembers).values({
        projectId: project.id,
        userId: user.sub,
      });
      return project;
    });
  }

  async getOne(user: AuthUser, id: string) {
    const project = await this.findInWorkspace(user, id);
    if (user.role !== 'ADMIN') {
      const [member] = await this.db
        .select({ userId: projectMembers.userId })
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, id),
            eq(projectMembers.userId, user.sub),
          ),
        )
        .limit(1);
      if (!member) throw new ForbiddenException();
    }
    return project;
  }

  async update(user: AuthUser, id: string, input: UpdateProjectInput) {
    await this.findInWorkspace(user, id);
    const [updated] = await this.db
      .update(projects)
      .set({ ...input, updatedAt: new Date() })
      .where(
        and(eq(projects.id, id), eq(projects.workspaceId, user.workspaceId)),
      )
      .returning();
    return updated;
  }

  async listMembers(user: AuthUser, id: string) {
    await this.getOne(user, id);
    return this.db
      .select({
        userId: projectMembers.userId,
        name: users.name,
        email: users.email,
      })
      .from(projectMembers)
      .innerJoin(users, eq(users.id, projectMembers.userId))
      .where(eq(projectMembers.projectId, id));
  }

  async addMember(user: AuthUser, id: string, input: AddMemberInput) {
    await this.findInWorkspace(user, id);
    const [target] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.id, input.userId),
          eq(users.workspaceId, user.workspaceId),
        ),
      )
      .limit(1);
    if (!target) {
      throw new NotFoundException('Usuário não encontrado no workspace');
    }
    await this.db
      .insert(projectMembers)
      .values({
        projectId: id,
        userId: input.userId,
      })
      .onConflictDoNothing();
    return { ok: true };
  }

  async removeMember(user: AuthUser, id: string, userId: string) {
    await this.findInWorkspace(user, id);
    await this.db
      .delete(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, id),
          eq(projectMembers.userId, userId),
        ),
      );
    return { ok: true };
  }

  private async findInWorkspace(user: AuthUser, id: string) {
    const [project] = await this.db
      .select()
      .from(projects)
      .where(
        and(eq(projects.id, id), eq(projects.workspaceId, user.workspaceId)),
      )
      .limit(1);
    if (!project) throw new NotFoundException();
    return project;
  }
}
