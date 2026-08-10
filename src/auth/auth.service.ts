import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../database/drizzle.constants';
import type { DrizzleDB } from '../database/drizzle.module';
import { User, users, workspaces } from '../database/schema';
import { LoginInput, RegisterInput } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly jwt: JwtService,
  ) {}

  async register(input: RegisterInput) {
    const existing = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);
    if (existing.length) throw new ConflictException('E-mail já cadastrado');

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await this.db.transaction(async (tx) => {
      let [workspace] = await tx.select().from(workspaces).limit(1);
      if (!workspace) {
        [workspace] = await tx
          .insert(workspaces)
          .values({ name: 'Logiccos' })
          .returning();
      }

      const [firstUser] = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.workspaceId, workspace.id))
        .limit(1);
      const role: 'ADMIN' | 'MEMBER' = firstUser ? 'MEMBER' : 'ADMIN';

      const [created] = await tx
        .insert(users)
        .values({
          workspaceId: workspace.id,
          name: input.name,
          email: input.email,
          passwordHash,
          role,
        })
        .returning();
      return created;
    });

    return this.publicUser(user);
  }

  async validate(input: LoginInput): Promise<User> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);
    if (!user || !user.active) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciais inválidas');
    return user;
  }

  async sign(user: {
    id: string;
    workspaceId: string;
    role: 'ADMIN' | 'MEMBER';
  }) {
    return this.jwt.signAsync({
      sub: user.id,
    });
  }

  async me(userId: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) throw new UnauthorizedException();
    return this.publicUser(user);
  }

  publicUser(u: User) {
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      active: u.active,
    };
  }
}
