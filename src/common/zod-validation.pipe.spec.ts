import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';

const schema = z.object({ name: z.string().min(2) });

describe('ZodValidationPipe', () => {
  it('returns parsed value when valid', () => {
    const pipe = new ZodValidationPipe(schema);
    expect(pipe.transform({ name: 'Ana' })).toEqual({ name: 'Ana' });
  });

  it('throws BadRequest when invalid', () => {
    const pipe = new ZodValidationPipe(schema);
    expect(() => pipe.transform({ name: 'x' })).toThrow(BadRequestException);
  });
});
