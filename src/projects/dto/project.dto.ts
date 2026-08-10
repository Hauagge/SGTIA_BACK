import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

export const updateProjectSchema = z
  .object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    active: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: 'Nenhum campo para atualizar',
  });

export const addMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['ADMIN', 'MEMBER']).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
