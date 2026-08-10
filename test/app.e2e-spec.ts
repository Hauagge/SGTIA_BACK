import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from './../src/app.module';
import { DRIZZLE } from './../src/database/drizzle.constants';
import {
  projectMembers,
  projects,
  users,
  workspaces,
} from './../src/database/schema';

describe('SGTIA happy path (e2e)', () => {
  let app: INestApplication;
  let shared: ReturnType<typeof request.agent>;
  const email = `e2e_${Date.now()}@logiccos.com`;
  const password = 'secret123';
  let projectId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    await app.init();
    shared = request.agent(app.getHttpServer());

    const db = app.get(DRIZZLE);
    await db.delete(projectMembers);
    await db.delete(projects);
    await db.delete(users);
    await db.delete(workspaces);
  });

  afterAll(async () => {
    await app.close();
  });

  it('health is public', async () => {
    const res = await request(app.getHttpServer()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('registers the first user as ADMIN', async () => {
    const res = await shared
      .post('/api/auth/register')
      .send({ name: 'Ana', email, password });
    expect(res.status).toBe(201);
    expect(res.body.role).toBe('ADMIN');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('returns the current user from /me', async () => {
    const res = await shared.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(email);
  });

  it('creates a project', async () => {
    const res = await shared
      .post('/api/projects')
      .send({ name: 'AgendouAI', description: 'Agendamento' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('AgendouAI');
    projectId = res.body.id;
  });

  it('lists the created project', async () => {
    const res = await shared.get('/api/projects');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(projectId);
  });

  it('logs out and blocks /me', async () => {
    const logoutRes = await shared.post('/api/auth/logout');
    expect(logoutRes.status).toBe(200);
    const meRes = await shared.get('/api/auth/me');
    expect(meRes.status).toBe(401);
  });

  it('logs back in', async () => {
    const res = await shared.post('/api/auth/login').send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(email);
  });
});
