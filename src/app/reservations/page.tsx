"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchReservations, updateReservation, deleteReservation } from "@/features/reservations/api";
import type { Reservation } from "@/types/reservation";
import { RESERVATION_STATUS_LABELS } from "@/types/reservation";
import type { ReservationStatus } from "@/types/reservation";
import { formatDateTime } from "@/lib/utils";

const SERVICE_TYPES = ["정비", "튜닝", "점검", "기타"];

function getMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export default function ReservationsPage() {
  const router = useRouter();
  const defaultRange = getMonthRange();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [fromDate, setFromDate] = useState(defaultRange.from);
  const [toDate, setToDate] = useState(defaultRange.to);
  const [statusFilter, setStatusFilter] = useState("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchReservations(fromDate, toDate, statusFilter, serviceTypeFilter);
      setReservations(data);
    } catch {
      setReservations([]);
    }
    setLoading(false);

    // Calendar 연결 상태 확인
    try {
      const res = await fetch("/api/calendar/status");
      const status = await res.json();
      setCalendarConnected(status.connected);
    } catch { /* ignore */ }
  }, [fromDate, toDate, statusFilter, serviceTypeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (id: string, status: string) => {
    await updateReservation(id, { status } as Partial<Reservation>);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("예약을 삭제하시겠습니까? Google Calendar에서도 삭제됩니다.")) return;
    await deleteReservation(id);
    load();
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    CONFIRMED: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-gray-100 text-gray-500",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">예약 관리</h1>
        <div className="flex gap-2">
          {!calendarConnected && (
            <a
              href="/api/auth/google"
              className="glass-card rounded-lg px-3 py-2 text-sm hover:bg-[var(--accent)]"
            >
              Google Calendar 연결
            </a>
          )}
          {calendarConnected && (
            <span className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              Google Calendar 연결됨
            </span>
          )}
          <Link
            href="/reservations/new"
            className="glass-btn rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            + 예약 등록
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
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
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="glass-input rounded-lg px-3 py-2 text-sm"
        >
          <option value="">전체 상태</option>
          {Object.entries(RESERVATION_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={serviceTypeFilter}
          onChange={(e) => setServiceTypeFilter(e.target.value)}
          className="glass-input rounded-lg px-3 py-2 text-sm"
        >
          <option value="">전체 서비스</option>
          {SERVICE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-[var(--muted-foreground)]">로딩 중...</p>
      ) : reservations.length === 0 ? (
        <div className="glass-card p-8 text-center text-[var(--muted-foreground)]">
          등록된 예약이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => (
            <div
              key={r.id}
              onClick={() => router.push(`/reservations/${r.id}`)}
              className="glass-card glass-card-clickable p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`rounded px-2 py-0.5 text-xs font-bold ${statusColors[r.status] || ""}`}>
                      {RESERVATION_STATUS_LABELS[r.status as ReservationStatus] || r.status}
                    </span>
                    <span className="font-medium">
                      [{r.serviceType}] {r.customer?.name}
                    </span>
                    {r.calendarEventId && <span className="text-xs text-green-600">📅</span>}
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {formatDateTime(r.scheduledAt)} ({r.duration}분)
                    {r.vehicle && ` | ${r.vehicle.carModel}`}
                  </p>
                  {r.description && (
                    <p className="mt-1 text-sm">{r.description}</p>
                  )}
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  {r.status === "PENDING" && (
                    <button
                      onClick={() => handleStatusChange(r.id, "CONFIRMED")}
                      className="action-btn rounded px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100"
                    >
                      확정
                    </button>
                  )}
                  {(r.status === "PENDING" || r.status === "CONFIRMED") && (
                    <button
                      onClick={() => handleStatusChange(r.id, "COMPLETED")}
                      className="action-btn rounded px-2 py-1 text-xs bg-green-50 text-green-600 hover:bg-green-100"
                    >
                      완료
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="action-btn rounded px-2 py-1 text-xs text-[var(--destructive)] hover:bg-red-50"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
