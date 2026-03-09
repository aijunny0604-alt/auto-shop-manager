"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createInventoryItem } from "@/features/inventory/api";
import { CATEGORIES } from "@/types/inventory";

export default function NewInventoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    try {
      await createInventoryItem({
        name: form.get("name") as string,
        category: form.get("category") as string,
        quantity: Number(form.get("quantity")) || 0,
        minQuantity: Number(form.get("minQuantity")) || 5,
        unitPrice: Number(form.get("unitPrice")) || 0,
        location: (form.get("location") as string) || undefined,
        memo: (form.get("memo") as string) || undefined,
      });
      router.push("/inventory");
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">부품 등록</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-[var(--destructive)]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">부품명 *</label>
          <input
            name="name"
            required
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            placeholder="예: 엔진오일 5W-30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">카테고리 *</label>
          <select
            name="category"
            required
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          >
            <option value="">선택하세요</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">초기 수량</label>
            <input
              name="quantity"
              type="number"
              min="0"
              defaultValue="0"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">최소 수량</label>
            <input
              name="minQuantity"
              type="number"
              min="0"
              defaultValue="5"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">단가 (원)</label>
            <input
              name="unitPrice"
              type="number"
              min="0"
              defaultValue="0"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">보관 위치</label>
          <input
            name="location"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            placeholder="예: 선반 A-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">메모</label>
          <textarea
            name="memo"
            rows={3}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[var(--primary)] px-6 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "등록 중..." : "등록"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-[var(--border)] px-6 py-2 text-sm font-medium hover:bg-[var(--accent)]"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
