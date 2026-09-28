import { z } from 'zod';

export const credentials = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  password: z.string().min(12).max(128)
}).strict();

const list = z.array(z.string().trim().min(1).max(60)).max(20);
export const profile = z.object({
  displayName: z.string().trim().min(1).max(80),
  city: z.string().trim().min(1).max(100),
  bio: z.string().trim().max(1000).default(''),
  languages: list.default([]),
  dietaryPreferences: list.default([]),
  allergies: list.default([]),
  meetingContext: z.string().trim().max(300).default('')
}).strict();
