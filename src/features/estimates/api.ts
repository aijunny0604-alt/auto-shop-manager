import type { Estimate } from "@/types/estimate";

export async function fetchEstimates(search?: string, status?: string, from?: string, to?: string): Promise<Estimate[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const res = await fetch(`/api/estimates?${params}`);
  if (!res.ok) throw new Error("견적서 목록 조회 실패");
  return res.json();
}

export async function fetchEstimate(id: string): Promise<Estimate> {
  const res = await fetch(`/api/estimates/${id}`);
  if (!res.ok) throw new Error("견적서 조회 실패");
  return res.json();
}

export async function createEstimate(data: Record<string, unknown>): Promise<Estimate> {
  const res = await fetch("/api/estimates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "생성 실패" }));
    throw new Error(err.error);
  }
  return res.json();
}

export async function updateEstimate(id: string, data: Record<string, unknown>): Promise<Estimate> {
  const res = await fetch(`/api/estimates/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("수정 실패");
  return res.json();
}

export async function deleteEstimate(id: string): Promise<void> {
  const res = await fetch(`/api/estimates/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("삭제 실패");
}
