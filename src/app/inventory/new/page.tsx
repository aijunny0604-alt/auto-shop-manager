"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createInventorySchema } from "@/lib/validations/inventory";
import { createInventoryItem } from "@/features/inventory/api";
import { useAppStore } from "@/store/useAppStore";
import { CATEGORIES } from "@/types/inventory";
import { z } from "zod";

type FormValues = z.infer<typeof createInventorySchema>;

export default function NewInventoryPage() {
  const router = useRouter();
  const addToast = useAppStore((s) => s.addToast);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createInventorySchema),
    defaultValues: {
      quantity: 0,
      minQuantity: 5,
      unitPrice: 0,
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await createInventoryItem(data);
      addToast("부품이 등록되었습니다.", "success");
      router.push("/inventory");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "등록 실패", "error");
    }
  };

  const inputClass =
    "glass-input w-full rounded-lg px-3 py-2 text-sm";
  const errorClass = "text-xs text-[var(--destructive)] mt-1";

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">부품 등록</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">부품명 *</label>
          <input
            {...register("name")}
            className={inputClass}
            placeholder="예: 엔진오일 5W-30"
          />
          {errors.name && <p className={errorClass}>{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">카테고리 *</label>
          <input
            {...register("category")}
            list="category-list"
            className={inputClass}
            placeholder="선택 또는 직접 입력"
            autoComplete="off"
          />
          <datalist id="category-list">
            {CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          {errors.category && <p className={errorClass}>{errors.category.message}</p>}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">초기 수량</label>
            <input
              {...register("quantity", { valueAsNumber: true })}
              type="number"
              min="0"
              className={inputClass}
            />
            {errors.quantity && <p className={errorClass}>{errors.quantity.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">최소 수량</label>
            <input
              {...register("minQuantity", { valueAsNumber: true })}
              type="number"
              min="0"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">단가 (원)</label>
            <input
              {...register("unitPrice", { valueAsNumber: true })}
              type="number"
              min="0"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">보관 위치</label>
          <input
            {...register("location")}
            className={inputClass}
            placeholder="예: 선반 A-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">메모</label>
          <textarea {...register("memo")} rows={3} className={inputClass} />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="glass-btn rounded-lg px-6 py-2 text-sm font-medium disabled:opacity-50"
          >
            {isSubmitting ? "등록 중..." : "등록"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="glass-btn rounded-lg px-6 py-2 text-sm font-medium"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
