"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCustomerSchema } from "@/lib/validations/customer";
import { useAppStore } from "@/store/useAppStore";
import { z } from "zod";

type FormValues = z.infer<typeof createCustomerSchema>;

export default function NewCustomerPage() {
  const router = useRouter();
  const addToast = useAppStore((s) => s.addToast);
  const [addVehicle, setAddVehicle] = useState(false);
  const [vehicleData, setVehicleData] = useState({
    carModel: "",
    year: "",
    plateNumber: "",
    mileage: "",
    memo: "",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createCustomerSchema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const payload: Record<string, unknown> = { ...data };
      if (addVehicle && vehicleData.carModel.trim()) {
        payload.vehicle = {
          carModel: vehicleData.carModel.trim(),
          year: vehicleData.year ? parseInt(vehicleData.year) : null,
          plateNumber: vehicleData.plateNumber || null,
          mileage: vehicleData.mileage ? parseInt(vehicleData.mileage) : null,
          memo: vehicleData.memo || null,
        };
      }

      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("등록 실패");

      addToast(
        addVehicle && vehicleData.carModel.trim()
          ? "고객 + 차량이 등록되었습니다."
          : "고객이 등록되었습니다.",
        "success"
      );
      router.push("/customers");
    } catch {
      addToast("등록 실패", "error");
    }
  };

  const inputClass =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm";
  const errorClass = "text-xs text-[var(--destructive)] mt-1";

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">고객 등록</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">고객명 *</label>
          <input {...register("name")} className={inputClass} />
          {errors.name && <p className={errorClass}>{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">연락처</label>
          <input
            {...register("phone")}
            type="tel"
            placeholder="010-0000-0000"
            className={inputClass}
          />
          {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">메모</label>
          <textarea {...register("memo")} rows={3} className={inputClass} />
        </div>

        {/* 차량 정보 */}
        <div className="border-t border-[var(--border)] pt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={addVehicle}
              onChange={(e) => setAddVehicle(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm font-medium">차량 정보 함께 등록</span>
          </label>
        </div>

        {addVehicle && (
          <div className="rounded-lg border border-[var(--border)] p-4 space-y-3 bg-[var(--accent)]/30">
            <p className="text-sm font-medium">🚗 차량 정보</p>
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">차종 *</label>
              <input
                value={vehicleData.carModel}
                onChange={(e) => setVehicleData({ ...vehicleData, carModel: e.target.value })}
                placeholder="예: 소나타, K5, 아반떼"
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">연식</label>
                <input
                  type="number"
                  value={vehicleData.year}
                  onChange={(e) => setVehicleData({ ...vehicleData, year: e.target.value })}
                  placeholder="예: 2023"
                  min={1990}
                  max={new Date().getFullYear() + 1}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">번호판</label>
                <input
                  value={vehicleData.plateNumber}
                  onChange={(e) => setVehicleData({ ...vehicleData, plateNumber: e.target.value })}
                  placeholder="예: 12가 3456"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">주행거리 (km)</label>
                <input
                  type="number"
                  value={vehicleData.mileage}
                  onChange={(e) => setVehicleData({ ...vehicleData, mileage: e.target.value })}
                  placeholder="예: 50000"
                  min={0}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">차량 메모</label>
                <input
                  value={vehicleData.memo}
                  onChange={(e) => setVehicleData({ ...vehicleData, memo: e.target.value })}
                  placeholder="예: 사고 이력 있음"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-[var(--primary)] px-6 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-50"
          >
            {isSubmitting ? "등록 중..." : "등록"}
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
