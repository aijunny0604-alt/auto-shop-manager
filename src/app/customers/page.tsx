"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCustomers } from "@/features/customers/api";
import type { Customer } from "@/types/customer";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchCustomers(search);
      setCustomers(data);
    } catch {
      setCustomers([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">고객 관리</h1>
        <div className="flex gap-2">
          <Link
            href="/reservations/new"
            className="glass-btn rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            + 예약 등록
          </Link>
          <Link
            href="/customers/new"
            className="glass-card rounded-lg px-4 py-2 text-sm font-medium hover:bg-[var(--accent)]"
          >
            + 고객만 등록
          </Link>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
        className="mb-4"
      >
        <input
          type="text"
          placeholder="고객명 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="glass-input w-full max-w-md rounded-lg px-3 py-2 text-sm"
        />
      </form>

      {loading ? (
        <p className="text-[var(--muted-foreground)]">로딩 중...</p>
      ) : customers.length === 0 ? (
        <div className="glass-card p-8 text-center text-[var(--muted-foreground)]">
          등록된 고객이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {customers.map((c) => (
            <Link
              key={c.id}
              href={`/customers/${c.id}`}
              className="glass-card p-4 hover:bg-[var(--accent)] transition-colors"
            >
              <p className="font-medium truncate">{c.name}</p>
              <p className="text-sm text-[var(--muted-foreground)] truncate">
                {c.phone || "연락처 없음"}
              </p>
              <div className="flex gap-3 mt-2 text-xs text-[var(--muted-foreground)]">
                <span>차량 {c._count?.vehicles ?? 0}</span>
                <span>예약 {c._count?.reservations ?? 0}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
