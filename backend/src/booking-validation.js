import { z } from 'zod';
import { photoUrl } from './validation.js';
import { dietaryTag } from './experience-search.js';

export const experienceInput = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(3000).default(''),
  city: z.string().trim().min(1).max(100),
  cuisine: z.string().trim().min(1).max(80),
  theme: z.string().trim().max(80).default(''),
  photoUrl,
  atmosphere: z.string().trim().max(80).default(''),
  dietaryOptions: z.array(dietaryTag).max(20).default([]),
  menuPriceCents: z.number().int().min(100).max(100000)
}).strict();
export const dateInput = z.object({ startsAt: z.iso.datetime({ offset: true }), capacity: z.number().int().min(1).max(30) }).strict();
export const menuItemInput = z.object({ title: z.string().trim().min(1).max(120), description: z.string().trim().max(500).default(''), position: z.number().int().min(0).max(30) }).strict();
export const bookingInput = z.object({ dateId: z.uuid(), guests: z.number().int().min(1).max(10) }).strict();
export const uuidParam = z.uuid();

export function quote(menuPriceCents, serviceFeeCents, guests) {
  return { menuSubtotalCents: menuPriceCents * guests, serviceFeeCents: serviceFeeCents * guests, totalCents: (menuPriceCents + serviceFeeCents) * guests, currency: 'eur' };
}
