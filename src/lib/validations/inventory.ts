import { z } from "zod";

export const createInventorySchema = z.object({
  name: z.string().min(1, "부품명은 필수입니다."),
  category: z.string().min(1, "카테고리는 필수입니다."),
  quantity: z.number().int().min(0, "수량은 0 이상이어야 합니다."),
  minQuantity: z.number().int().min(0, "최소 수량은 0 이상이어야 합니다."),
  unitPrice: z.number().int().min(0, "단가는 0 이상이어야 합니다."),
  location: z.string().optional(),
  memo: z.string().optional(),
});

export const updateInventorySchema = createInventorySchema.partial();

export const stockLogSchema = z.object({
  type: z.enum(["IN", "OUT"], {
    error: 'type은 "IN" 또는 "OUT" 이어야 합니다.',
  }),
  quantity: z.number().int().min(1, "수량은 1 이상이어야 합니다."),
  reason: z.string().optional(),
});

export type CreateInventoryInput = z.infer<typeof createInventorySchema>;
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;
export type StockLogInput = z.infer<typeof stockLogSchema>;
