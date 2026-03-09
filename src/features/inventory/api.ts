import type { InventoryItem, CreateInventoryInput, StockLogInput } from "@/types/inventory";

const BASE = "/api/inventory";

export async function fetchInventory(search?: string, category?: string): Promise<InventoryItem[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  const res = await fetch(`${BASE}?${params}`);
  return res.json();
}

export async function fetchInventoryItem(id: string) {
  const res = await fetch(`${BASE}/${id}`);
  return res.json();
}

export async function createInventoryItem(data: CreateInventoryInput): Promise<InventoryItem> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function updateInventoryItem(id: string, data: Partial<CreateInventoryInput>): Promise<InventoryItem> {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function deleteInventoryItem(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("삭제 실패");
}

export async function createStockLog(itemId: string, data: StockLogInput) {
  const res = await fetch(`${BASE}/${itemId}/stock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function fetchLowStockItems(): Promise<InventoryItem[]> {
  const res = await fetch(`${BASE}/alerts`);
  return res.json();
}
