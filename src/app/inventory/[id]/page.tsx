"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  fetchInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  createStockLog,
} from "@/features/inventory/api";
import { CATEGORIES } from "@/types/inventory";
import type { StockLog } from "@/types/inventory";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function InventoryDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Record<string, unknown> | null>(null);
  const [editing, setEditing] = useState(false);
  const [stockType, setStockType] = useState<"IN" | "OUT">("IN");
  const [stockQty, setStockQty] = useState(1);
  const [stockReason, setStockReason] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const data = await fetchInventoryItem(id);
    setItem(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await deleteInventoryItem(id);
    router.push("/inventory");
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await updateInventoryItem(id, {
      name: form.get("name") as string,
      category: form.get("category") as string,
      quantity: Number(form.get("quantity")),
      minQuantity: Number(form.get("minQuantity")),
      unitPrice: Number(form.get("unitPrice")),
      location: (form.get("location") as string) || undefined,
      memo: (form.get("memo") as string) || undefined,
    });
    setEditing(false);
    load();
  };

  const handleStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createStockLog(id, {
        type: stockType,
        quantity: stockQty,
        reason: stockReason || undefined,
      });
      setStockQty(1);
      setStockReason("");
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "오류 발생");
    }
  };

  if (loading) return <p className="text-[var(--muted-foreground)]">로딩 중...</p>;
  if (!item) return <p>부품을 찾을 수 없습니다.</p>;

  const stockLogs = (item.stockLogs as StockLog[]) || [];

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{item.name as string}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className="glass-btn rounded-lg px-3 py-1.5 text-sm"
          >
            {editing ? "취소" : "수정"}
          </button>
          <button
            onClick={handleDelete}
            className="glass-btn-danger rounded-lg px-3 py-1.5 text-sm"
          >
            삭제
          </button>
        </div>
      </div>

      {editing ? (
        <form onSubmit={handleUpdate} className="space-y-4 mb-8">
          <input name="name" defaultValue={item.name as string} required className="glass-input w-full rounded-lg px-3 py-2 text-sm" />
          <input name="category" defaultValue={item.category as string} list="category-list-edit" autoComplete="off" placeholder="선택 또는 직접 입력" className="glass-input w-full rounded-lg px-3 py-2 text-sm" />
          <datalist id="category-list-edit">
            {CATEGORIES.map((c) => <option key={c} value={c} />)}
          </datalist>
          <div className="grid grid-cols-3 gap-3">
            <input name="quantity" type="number" defaultValue={item.quantity as number} className="glass-input rounded-lg px-3 py-2 text-sm" />
            <input name="minQuantity" type="number" defaultValue={item.minQuantity as number} className="glass-input rounded-lg px-3 py-2 text-sm" />
            <input name="unitPrice" type="number" defaultValue={item.unitPrice as number} className="glass-input rounded-lg px-3 py-2 text-sm" />
          </div>
          <input name="location" defaultValue={(item.location as string) || ""} placeholder="보관 위치" className="glass-input w-full rounded-lg px-3 py-2 text-sm" />
          <textarea name="memo" defaultValue={(item.memo as string) || ""} rows={2} className="glass-input w-full rounded-lg px-3 py-2 text-sm" />
          <button type="submit" className="glass-btn rounded-lg px-6 py-2 text-sm">저장</button>
        </form>
      ) : (
        <div className="glass-card grid grid-cols-2 gap-4 mb-8 p-4">
          <div><span className="text-xs text-[var(--muted-foreground)]">카테고리</span><p className="font-medium">{item.category as string}</p></div>
          <div><span className="text-xs text-[var(--muted-foreground)]">수량</span><p className={`font-medium ${(item.quantity as number) <= (item.minQuantity as number) ? "text-[var(--destructive)]" : ""}`}>{item.quantity as number}개</p></div>
          <div><span className="text-xs text-[var(--muted-foreground)]">최소 수량</span><p className="font-medium">{item.minQuantity as number}개</p></div>
          <div><span className="text-xs text-[var(--muted-foreground)]">단가</span><p className="font-medium">{formatCurrency(item.unitPrice as number)}</p></div>
          <div><span className="text-xs text-[var(--muted-foreground)]">보관 위치</span><p className="font-medium">{(item.location as string) || "-"}</p></div>
          <div><span className="text-xs text-[var(--muted-foreground)]">메모</span><p className="font-medium">{(item.memo as string) || "-"}</p></div>
        </div>
      )}

      {/* 입출고 */}
      <h2 className="text-lg font-bold mb-3">입출고 기록</h2>
      <form onSubmit={handleStock} className="flex gap-2 mb-4 flex-wrap">
        <select value={stockType} onChange={(e) => setStockType(e.target.value as "IN" | "OUT")} className="glass-input rounded-lg px-3 py-2 text-sm">
          <option value="IN">입고</option>
          <option value="OUT">출고</option>
        </select>
        <input type="number" min="1" value={stockQty} onChange={(e) => setStockQty(Number(e.target.value))} className="glass-input w-20 rounded-lg px-3 py-2 text-sm" />
        <input placeholder="사유" value={stockReason} onChange={(e) => setStockReason(e.target.value)} className="glass-input flex-1 min-w-[150px] rounded-lg px-3 py-2 text-sm" />
        <button type="submit" className="glass-btn rounded-lg px-4 py-2 text-sm">기록</button>
      </form>

      {stockLogs.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">입출고 기록이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {stockLogs.map((log: StockLog) => (
            <div key={log.id} className="glass-card flex items-center gap-3 rounded-lg p-3 text-sm">
              <span className={`rounded px-2 py-0.5 text-xs font-bold ${log.type === "IN" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {log.type === "IN" ? "입고" : "출고"}
              </span>
              <span className="font-medium">{log.quantity}개</span>
              <span className="text-[var(--muted-foreground)]">{log.reason || ""}</span>
              <span className="ml-auto text-xs text-[var(--muted-foreground)]">{formatDateTime(log.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
