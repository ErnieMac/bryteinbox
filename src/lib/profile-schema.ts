import { z } from 'zod';

export const profileSchema = z.object({
  displayName: z.string().trim().min(1, 'Enter your display name').max(100),
  avatarUrl: z.union([z.literal(''), z.string().url().refine((url) => url.startsWith('https://'), 'Use an HTTPS image URL')]),
});