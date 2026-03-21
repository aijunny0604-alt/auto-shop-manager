"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchEstimates, deleteEstimate } from "@/features/estimates/api";
import { useAppStore } from "@/store/useAppStore";
import type { Estimate } from "@/types/estimate";
import { ESTIMATE_STATUS_LABELS } from "@/types/estimate";

export default function EstimatesPage() {
  const router = useRouter();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const addToast = useAppStore((s) => s.addToast);

  const load = useCallback(async () => {
    try {
      const data = await fetchEstimates(search, statusFilter, fromDate, toDate);
      setEstimates(data);
    } catch {
      addToast("견적서 목록 조회 실패", "error");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, fromDate, toDate, addToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("이 견적서를 삭제하시겠습니까?")) return;
    try {
      await deleteEstimate(id);
      addToast("견적서가 삭제되었습니다.", "success");
      load();
    } catch {
      addToast("삭제 실패", "error");
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "DRAFT": return "bg-gray-100 text-gray-700";
      case "SENT": return "bg-blue-100 text-blue-700";
      case "ACCEPTED": return "bg-green-100 text-green-700";
      case "REJECTED": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const formatCurrency = (n: number) => n.toLocaleString("ko-KR") + "원";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">견적서 관리</h1>
        <Link
          href="/estimates/new"
          className="glass-btn rounded-lg px-4 py-2 text-sm font-medium"
        >
          + 견적서 작성
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="고객명 또는 견적번호 검색..."
          className="glass-input flex-1 min-w-[200px] rounded-lg px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="glass-input rounded-lg px-3 py-2 text-sm"
        >
          <option value="">전체 상태</option>
          {Object.entries(ESTIMATE_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <div className="flex items-center gap-1.5">
          <label className="text-sm text-[var(--muted-foreground)] whitespace-nowrap">기간</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="glass-input rounded-lg px-3 py-2 text-sm"
          />
          <span className="text-sm text-[var(--muted-foreground)]">~</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="glass-input rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-center py-10 text-[var(--muted-foreground)]">로딩 중...</p>
      ) : estimates.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-[var(--muted-foreground)]">견적서가 없습니다.</p>
          <Link
            href="/estimates/new"
            className="mt-3 inline-block text-sm text-[var(--primary)] hover:underline"
          >
            첫 견적서 작성하기
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {estimates.map((est) => (
            <div
              key={est.id}
              onClick={() => router.push(`/estimates/${est.id}`)}
              className="glass-card glass-card-clickable flex items-center gap-4 p-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-medium">{est.estimateNo}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(est.status)}`}>
                    {ESTIMATE_STATUS_LABELS[est.status] || est.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                  <span>{est.customer?.name}</span>
                  {est.vehicle && <span>{est.vehicle.carModel}</span>}
                  <span>{new Date(est.createdAt).toLocaleDateString("ko-KR")}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">{formatCurrency(est.totalAmount)}</p>
              </div>
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <Link
                  href={`/estimates/${est.id}/print`}
                  className="action-btn rounded px-3 py-1.5 text-xs border border-[var(--border)] hover:bg-[var(--accent)]"
                >
                  인쇄
                </Link>
                <button
                  onClick={() => handleDelete(est.id)}
                  className="action-btn rounded px-3 py-1.5 text-xs text-[var(--destructive)] border border-[var(--destructive)]/30 hover:bg-[var(--destructive)]/10"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
