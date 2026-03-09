"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createReservation } from "@/features/reservations/api";
import { fetchCustomers } from "@/features/customers/api";
import type { Customer } from "@/types/customer";
import { SERVICE_TYPES } from "@/types/customer";

export default function NewReservationPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [vehicles, setVehicles] = useState<{ id: string; carModel: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCustomers().then(setCustomers);
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      // 선택된 고객의 차량 목록 로드
      fetch(`/api/customers/${selectedCustomerId}`)
        .then((r) => r.json())
        .then((data) => setVehicles(data.vehicles || []));
    } else {
      setVehicles([]);
    }
  }, [selectedCustomerId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await createReservation({
        customerId: form.get("customerId") as string,
        vehicleId: (form.get("vehicleId") as string) || undefined,
        scheduledAt: form.get("scheduledAt") as string,
        duration: Number(form.get("duration")) || 60,
        serviceType: form.get("serviceType") as string,
        description: (form.get("description") as string) || undefined,
        memo: (form.get("memo") as string) || undefined,
      });
      router.push("/reservations");
    } catch (err) {
      alert(err instanceof Error ? err.message : "등록 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">예약 등록</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">고객 *</label>
          <select
            name="customerId"
            required
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          >
            <option value="">고객 선택</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone && `(${c.phone})`}
              </option>
            ))}
          </select>
        </div>

        {vehicles.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1">차량</label>
            <select
              name="vehicleId"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            >
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
              name="scheduledAt"
              type="datetime-local"
              required
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">소요 시간 (분)</label>
            <input
              name="duration"
              type="number"
              defaultValue={60}
              min={15}
              step={15}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">작업 유형 *</label>
          <select
            name="serviceType"
            required
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          >
            {SERVICE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">작업 내용/요청사항</label>
          <textarea
            name="description"
            rows={3}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            placeholder="예: 엔진오일 교환, 에어필터 점검"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">메모</label>
          <textarea
            name="memo"
            rows={2}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[var(--primary)] px-6 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-50"
          >
            {loading ? "등록 중..." : "예약 등록"}
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
