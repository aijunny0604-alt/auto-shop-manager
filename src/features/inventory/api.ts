import type { InventoryItem, CreateInventoryInput, StockLogInput, ImportPreviewResult, ImportResult } from "@/types/inventory";

const BASE = "/api/inventory";

export async function fetchInventory(search?: string, category?: string, lowStock?: boolean): Promise<InventoryItem[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  if (lowStock) params.set("lowStock", "true");
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

// ── 임포트/엑스포트 ──

export async function previewImport(file: File): Promise<ImportPreviewResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE}/import/preview`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "미리보기 실패");
  }
  return res.json();
}

export async function importFile(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE}/import`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "임포트 실패");
  }
  return res.json();
}

export async function exportInventory(): Promise<void> {
  const res = await fetch(`${BASE}/export`);
  if (!res.ok) throw new Error("엑스포트 실패");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  // Content-Disposition 헤더에서 파일명 추출
  const disposition = res.headers.get("Content-Disposition");
  let filename = "재고백업.xlsx";
  if (disposition) {
    const match = disposition.match(/filename\*=UTF-8''(.+)/);
    if (match) filename = decodeURIComponent(match[1]);
  }
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
