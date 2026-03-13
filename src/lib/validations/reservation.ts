import { z } from "zod";

export const createReservationSchema = z.object({
  customerId: z.string().min(1, "고객은 필수입니다."),
  vehicleId: z.string().optional().nullable(),
  scheduledAt: z.string().min(1, "예약 일시는 필수입니다."),
  duration: z.number().int().min(15, "최소 15분 이상이어야 합니다."),
  serviceType: z.enum(["정비", "튜닝", "점검", "기타"], {
    error: "작업 유형은 정비, 튜닝, 점검, 기타 중 하나여야 합니다.",
  }),
  description: z.string().optional().nullable(),
  memo: z.string().optional().nullable(),
});

export const updateReservationSchema = createReservationSchema
  .partial()
  .extend({
    status: z
      .enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"], {
        error: "올바른 예약 상태가 아닙니다.",
      })
      .optional(),
  });

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;
