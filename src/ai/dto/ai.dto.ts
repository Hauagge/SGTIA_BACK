import { z } from 'zod';

export const interpretSchema = z.object({
  source: z.string().min(3),
});

export type InterpretInput = z.infer<typeof interpretSchema>;
