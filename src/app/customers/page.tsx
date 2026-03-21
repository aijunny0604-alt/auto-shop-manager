"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { fetchCustomers } from "@/features/customers/api";
import type { Customer } from "@/types/customer";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const load = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const data = await fetchCustomers(query);
      setCustomers(data);
    } catch {
      setCustomers([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load("");
  }, [load]);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(value), 300);
  };

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

      <div className="mb-4">
        <input
          type="text"
          placeholder="고객명, 전화번호, 차량번호, 차종으로 검색..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="glass-input w-full max-w-lg rounded-lg px-3 py-2 text-sm"
        />
      </div>

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
              className="glass-card glass-card-clickable p-4"
            >
              <p className="font-medium truncate">{c.name}</p>
              <p className="text-sm text-[var(--muted-foreground)] truncate">
                {c.phone || "연락처 없음"}
              </p>
              {c.vehicles && c.vehicles.length > 0 && (
                <div className="mt-2 space-y-0.5">
                  {c.vehicles.map((v: { carModel: string; plateNumber?: string | null }, i: number) => (
                    <p key={i} className="text-xs text-[var(--muted-foreground)] truncate">
                      🚗 {v.carModel}{v.plateNumber ? ` (${v.plateNumber})` : ""}
                    </p>
                  ))}
                </div>
              )}
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
