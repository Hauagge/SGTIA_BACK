import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import {
  addMemberSchema,
  createProjectSchema,
  updateProjectSchema,
} from './dto/project.dto';
import type {
  AddMemberInput,
  CreateProjectInput,
  UpdateProjectInput,
} from './dto/project.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { type AuthUser } from '../auth/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.projects.list(user);
  }

  @Post()
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createProjectSchema)) body: CreateProjectInput,
  ) {
    return this.projects.create(user, body);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.projects.getOne(user, id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProjectSchema)) body: UpdateProjectInput,
  ) {
    return this.projects.update(user, id, body);
  }

  @Get(':id/members')
  members(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.projects.listMembers(user, id);
  }

  @Post(':id/members')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  addMember(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addMemberSchema)) body: AddMemberInput,
  ) {
    return this.projects.addMember(user, id, body);
  }

  @Delete(':id/members/:userId')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  removeMember(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.projects.removeMember(user, id, userId);
  }
}
