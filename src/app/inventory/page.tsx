"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchInventory } from "@/features/inventory/api";
import type { InventoryItem } from "@/types/inventory";
import { CATEGORIES } from "@/types/inventory";
import { formatCurrency } from "@/lib/utils";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await fetchInventory(search, category);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [category]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">재고 관리</h1>
        <Link
          href="/inventory/new"
          className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
        >
          + 부품 등록
        </Link>
      </div>

      {/* 검색 & 필터 */}
      <div className="flex gap-3 mb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="flex-1"
        >
          <input
            type="text"
            placeholder="부품명 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          />
        </form>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
        >
          <option value="">전체 카테고리</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* 테이블 */}
      {loading ? (
        <p className="text-[var(--muted-foreground)]">로딩 중...</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-[var(--border)] p-8 text-center text-[var(--muted-foreground)]">
          등록된 부품이 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 text-left font-medium">부품명</th>
                <th className="px-4 py-3 text-left font-medium">카테고리</th>
                <th className="px-4 py-3 text-right font-medium">수량</th>
                <th className="px-4 py-3 text-right font-medium">최소수량</th>
                <th className="px-4 py-3 text-right font-medium">단가</th>
                <th className="px-4 py-3 text-left font-medium">위치</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-[var(--border)] hover:bg-[var(--accent)] cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/inventory/${item.id}`}
                      className="font-medium text-[var(--primary)] hover:underline"
                    >
                      {item.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{item.category}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={
                        item.quantity <= item.minQuantity
                          ? "text-[var(--destructive)] font-bold"
                          : ""
                      }
                    >
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--muted-foreground)]">
                    {item.minQuantity}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    {item.location || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
