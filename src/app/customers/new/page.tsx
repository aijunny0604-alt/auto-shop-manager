"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCustomerSchema } from "@/lib/validations/customer";
import { createCustomer } from "@/features/customers/api";
import { useAppStore } from "@/store/useAppStore";
import { z } from "zod";

type FormValues = z.infer<typeof createCustomerSchema>;

export default function NewCustomerPage() {
  const router = useRouter();
  const addToast = useAppStore((s) => s.addToast);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createCustomerSchema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await createCustomer(data);
      addToast("고객이 등록되었습니다.", "success");
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
