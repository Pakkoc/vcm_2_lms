import { z } from 'zod';

export const PublishParamsSchema = z.object({
  id: z.string().uuid(),
});

export const CloseParamsSchema = z.object({
  id: z.string().uuid(),
});

export const ExtendDeadlineSchema = z.object({
  newDueDate: z.string(),
});


