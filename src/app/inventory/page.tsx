"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchInventory } from "@/features/inventory/api";
import type { InventoryItem } from "@/types/inventory";
import { CATEGORIES } from "@/types/inventory";
import { formatCurrency } from "@/lib/utils";
import SearchBar from "@/components/ui/SearchBar";
import DataTable, { type Column } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";

const columns: Column<InventoryItem>[] = [
  {
    key: "name",
    header: "부품명",
    render: (item) => (
      <Link href={`/inventory/${item.id}`} className="font-medium text-[var(--primary)] hover:underline">
        {item.name}
      </Link>
    ),
  },
  { key: "category", header: "카테고리", render: (item) => item.category },
  {
    key: "quantity",
    header: "수량",
    align: "right",
    render: (item) => (
      <span className={item.quantity <= item.minQuantity ? "text-[var(--destructive)] font-bold" : ""}>{item.quantity}</span>
    ),
  },
  {
    key: "minQuantity",
    header: "최소수량",
    align: "right",
    render: (item) => <span className="text-[var(--muted-foreground)]">{item.minQuantity}</span>,
  },
  { key: "unitPrice", header: "단가", align: "right", render: (item) => formatCurrency(item.unitPrice) },
  {
    key: "status",
    header: "상태",
    render: (item) => <StatusBadge status={item.quantity <= item.minQuantity ? "LOW_STOCK" : "IN_STOCK"} />,
  },
];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [allItems, setAllItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  // 기본 카테고리 + DB에 있는 커스텀 카테고리 병합
  const allCategories = Array.from(
    new Set([...CATEGORIES, ...allItems.map((i) => i.category)])
  );

  const load = async () => {
    setLoading(true);
    const data = await fetchInventory(search, category);
    setItems(data);
    if (!category && !search) setAllItems(data);
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

      <div className="flex gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} onSearch={load} placeholder="부품명 검색..." />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
        >
          <option value="">전체 카테고리</option>
          {allCategories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(item) => item.id}
        loading={loading}
        emptyTitle="등록된 부품이 없습니다."
        emptyDescription="부품을 등록하여 재고를 관리하세요."
      />
    </div>
  );
}
