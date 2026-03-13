"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createReservationSchema } from "@/lib/validations/reservation";
import { createReservation } from "@/features/reservations/api";
import { fetchCustomers } from "@/features/customers/api";
import { useAppStore } from "@/store/useAppStore";
import type { Customer } from "@/types/customer";
import { SERVICE_TYPES } from "@/types/customer";
import { z } from "zod";

type FormValues = z.infer<typeof createReservationSchema>;

export default function NewReservationPage() {
  const router = useRouter();
  const addToast = useAppStore((s) => s.addToast);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<{ id: string; carModel: string }[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createReservationSchema),
    defaultValues: {
      duration: 60,
      serviceType: "정비",
    },
  });

  const selectedCustomerId = watch("customerId");

  useEffect(() => {
    fetchCustomers().then(setCustomers);
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      fetch(`/api/customers/${selectedCustomerId}`)
        .then((r) => r.json())
        .then((data) => setVehicles(data.vehicles || []));
    } else {
      setVehicles([]);
    }
  }, [selectedCustomerId]);

  const onSubmit = async (data: FormValues) => {
    try {
      await createReservation({
        customerId: data.customerId,
        scheduledAt: data.scheduledAt,
        serviceType: data.serviceType,
        duration: data.duration,
        vehicleId: data.vehicleId || undefined,
        description: data.description || undefined,
        memo: data.memo || undefined,
      });
      addToast("예약이 등록되었습니다.", "success");
      router.push("/reservations");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "등록 실패", "error");
    }
  };

  const inputClass =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm";
  const errorClass = "text-xs text-[var(--destructive)] mt-1";

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">예약 등록</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">고객 *</label>
          <select {...register("customerId")} className={inputClass}>
            <option value="">고객 선택</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone && `(${c.phone})`}
              </option>
            ))}
          </select>
          {errors.customerId && <p className={errorClass}>{errors.customerId.message}</p>}
        </div>

        {vehicles.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1">차량</label>
            <select {...register("vehicleId")} className={inputClass}>
              <option value="">선택 안함</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.carModel}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">예약 일시 *</label>
            <input
              {...register("scheduledAt")}
              type="datetime-local"
              className={inputClass}
            />
            {errors.scheduledAt && <p className={errorClass}>{errors.scheduledAt.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">소요 시간 (분)</label>
            <input
              {...register("duration", { valueAsNumber: true })}
              type="number"
              min={15}
              step={15}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">작업 유형 *</label>
          <select {...register("serviceType")} className={inputClass}>
            {SERVICE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {errors.serviceType && <p className={errorClass}>{errors.serviceType.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">작업 내용/요청사항</label>
          <textarea
            {...register("description")}
            rows={3}
            className={inputClass}
            placeholder="예: 엔진오일 교환, 에어필터 점검"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">메모</label>
          <textarea {...register("memo")} rows={2} className={inputClass} />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-[var(--primary)] px-6 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-50"
          >
            {isSubmitting ? "등록 중..." : "예약 등록"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-[var(--border)] px-6 py-2 text-sm hover:bg-[var(--accent)]"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
