import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(1, "고객명은 필수입니다."),
  phone: z
    .string()
    .regex(/^[0-9\-+\s()]*$/, "올바른 전화번호 형식이 아닙니다.")
    .optional(),
  memo: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const createVehicleSchema = z.object({
  carModel: z.string().min(1, "차종은 필수입니다."),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional().nullable(),
  plateNumber: z.string().optional().nullable(),
  mileage: z.number().int().min(0).optional().nullable(),
  memo: z.string().optional().nullable(),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export const createServiceRecordSchema = z.object({
  serviceDate: z.string().min(1, "정비일은 필수입니다."),
  serviceType: z.enum(["정비", "튜닝", "점검", "기타"], {
    error: "정비 유형은 정비, 튜닝, 점검, 기타 중 하나여야 합니다.",
  }),
  description: z.string().min(1, "작업 내용은 필수입니다."),
  cost: z.number().int().min(0, "비용은 0 이상이어야 합니다.").optional().default(0),
  memo: z.string().optional().nullable(),
  partsUsed: z
    .array(
      z.object({
        inventoryItemId: z.string().min(1),
        quantity: z.number().int().min(1, "사용 수량은 1 이상이어야 합니다."),
      })
    )
    .optional()
    .default([]),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type CreateServiceRecordInput = z.infer<typeof createServiceRecordSchema>;
