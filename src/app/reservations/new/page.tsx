"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import CustomerAutocomplete from "@/components/ui/CustomerAutocomplete";
import { useAppStore } from "@/store/useAppStore";
import type { Customer } from "@/types/customer";
import { SERVICE_TYPES } from "@/types/customer";

const reservationFormSchema = z.object({
  scheduledAt: z.string().min(1, "예약 일시는 필수입니다."),
  duration: z.number().int().min(15, "최소 15분 이상이어야 합니다."),
  serviceType: z.enum(["정비", "튜닝", "점검", "기타"], {
    error: "작업 유형은 정비, 튜닝, 점검, 기타 중 하나여야 합니다.",
  }),
  vehicleId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  memo: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof reservationFormSchema>;

export default function NewReservationPage() {
  const router = useRouter();
  const addToast = useAppStore((s) => s.addToast);

  // 고객 상태 (자동완성으로 관리)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomerName, setNewCustomerName] = useState<string | null>(null);
  const [customerQuery, setCustomerQuery] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [customerError, setCustomerError] = useState("");
  const [vehicles, setVehicles] = useState<{ id: string; carModel: string }[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: {
      duration: 60,
      serviceType: "정비",
    },
  });

  // 기존 고객 선택 시 차량 목록 로드
  useEffect(() => {
    if (selectedCustomer) {
      fetch(`/api/customers/${selectedCustomer.id}`)
        .then((r) => r.json())
        .then((data) => setVehicles(data.vehicles || []))
        .catch(() => setVehicles([]));
    } else {
      setVehicles([]);
    }
  }, [selectedCustomer]);

  const onSubmit = async (data: FormValues) => {
    // 고객 유효성 검사: 입력만 하고 드롭다운에서 선택 안 한 경우 → 자동으로 신규 고객 처리
    const resolvedCustomerName = newCustomerName || (customerQuery.trim() || null);
    if (!selectedCustomer && !resolvedCustomerName) {
      setCustomerError("고객을 선택하거나 이름을 입력해주세요.");
      return;
    }
    setCustomerError("");

    try {
      const payload: Record<string, unknown> = {
        scheduledAt: data.scheduledAt,
        serviceType: data.serviceType,
        duration: data.duration,
        vehicleId: data.vehicleId || undefined,
        description: data.description || undefined,
        memo: data.memo || undefined,
      };

      if (selectedCustomer) {
        payload.customerId = selectedCustomer.id;
      } else {
        payload.customerName = resolvedCustomerName;
        payload.customerPhone = newCustomerPhone || undefined;
      }

      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.json().catch(() => ({ error: "서버 오류" }));
        throw new Error(msg.error || "등록 실패");
      }

      addToast(
        resolvedCustomerName
          ? `"${resolvedCustomerName}" 고객 등록 + 예약 완료!`
          : "예약이 등록되었습니다.",
        "success"
      );
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
        {/* 고객 자동완성 */}
        <div>
          <label className="block text-sm font-medium mb-1">고객 *</label>
          <CustomerAutocomplete
            selectedCustomer={selectedCustomer}
            onSelect={(customer) => {
              setSelectedCustomer(customer);
              setNewCustomerName(null);
              setCustomerQuery("");
              setNewCustomerPhone("");
              setCustomerError("");
            }}
            onNewCustomer={(name) => {
              setSelectedCustomer(null);
              setNewCustomerName(name);
              setCustomerQuery("");
              setCustomerError("");
            }}
            onQueryChange={(q) => setCustomerQuery(q)}
            onClear={() => {
              setSelectedCustomer(null);
              setNewCustomerName(null);
              setCustomerQuery("");
              setNewCustomerPhone("");
              setVehicles([]);
            }}
          />
          {customerError && <p className={errorClass}>{customerError}</p>}
        </div>

        {/* 신규 고객 전화번호 입력 */}
        {(newCustomerName || (!selectedCustomer && customerQuery.trim())) && (
          <div className="rounded-lg border border-[var(--primary)] bg-[var(--primary)]/5 p-3 space-y-2">
            <p className="text-sm font-medium text-[var(--primary)]">
              신규 고객: {newCustomerName || customerQuery.trim()}
            </p>
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">
                전화번호 (선택)
              </label>
              <input
                type="tel"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                placeholder="010-0000-0000"
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* 차량 선택 (기존 고객만) */}
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
