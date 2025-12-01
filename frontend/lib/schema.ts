import { z } from 'zod';

export const GiftItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  symbol: z.string().optional(),
  type: z.enum(['ERC20', 'NFT']),
  amount: z.number().optional(),
  image: z.string().optional()
});

export const GiftPackSchema = z.object({
  items: z.array(GiftItemSchema).min(1),
  message: z.string().max(256)
});

export type GiftItemInput = z.infer<typeof GiftItemSchema>;
