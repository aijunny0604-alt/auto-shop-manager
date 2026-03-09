"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCustomer } from "@/features/customers/api";

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await createCustomer({
        name: form.get("name") as string,
        phone: (form.get("phone") as string) || undefined,
        memo: (form.get("memo") as string) || undefined,
      });
      router.push("/customers");
    } catch {
      alert("등록 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">고객 등록</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">고객명 *</label>
          <input name="name" required className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">연락처</label>
          <input name="phone" type="tel" placeholder="010-0000-0000" className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">메모</label>
          <textarea name="memo" rows={3} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="rounded-lg bg-[var(--primary)] px-6 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-50">{loading ? "등록 중..." : "등록"}</button>
          <button type="button" onClick={() => router.back()} className="rounded-lg border border-[var(--border)] px-6 py-2 text-sm hover:bg-[var(--accent)]">취소</button>
        </div>
      </form>
    </div>
  );
}
