"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchReservation, updateReservation, deleteReservation } from "@/features/reservations/api";
import type { Reservation } from "@/types/reservation";
import { RESERVATION_STATUS_LABELS } from "@/types/reservation";
import type { ReservationStatus } from "@/types/reservation";
import { SERVICE_TYPES } from "@/types/customer";
import { formatDateTime } from "@/lib/utils";

export default function ReservationDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservation(id).then((data) => {
      setReservation(data);
      setLoading(false);
    });
  }, [id]);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await updateReservation(id, {
      scheduledAt: form.get("scheduledAt") as string,
      duration: Number(form.get("duration")),
      serviceType: form.get("serviceType") as string,
      description: (form.get("description") as string) || null,
      status: form.get("status") as string,
      memo: (form.get("memo") as string) || null,
    } as Partial<Reservation>);
    setEditing(false);
    const data = await fetchReservation(id);
    setReservation(data);
  };

  const handleDelete = async () => {
    if (!confirm("예약을 삭제하시겠습니까?")) return;
    await deleteReservation(id);
    router.push("/reservations");
  };

  if (loading) return <p className="text-[var(--muted-foreground)]">로딩 중...</p>;
  if (!reservation) return <p>예약을 찾을 수 없습니다.</p>;

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">예약 상세</h1>
        <div className="flex gap-2">
          <button onClick={() => setEditing(!editing)} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--accent)]">{editing ? "취소" : "수정"}</button>
          <button onClick={handleDelete} className="rounded-lg bg-[var(--destructive)] px-3 py-1.5 text-sm text-white hover:opacity-90">삭제</button>
        </div>
      </div>

      {editing ? (
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">예약 일시</label>
              <input name="scheduledAt" type="datetime-local" defaultValue={reservation.scheduledAt.slice(0, 16)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">소요 시간 (분)</label>
              <input name="duration" type="number" defaultValue={reservation.duration} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">작업 유형</label>
              <select name="serviceType" defaultValue={reservation.serviceType} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
                {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">상태</label>
              <select name="status" defaultValue={reservation.status} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
                {Object.entries(RESERVATION_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">작업 내용</label>
            <textarea name="description" rows={3} defaultValue={reservation.description || ""} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">메모</label>
            <textarea name="memo" rows={2} defaultValue={reservation.memo || ""} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="rounded-lg bg-[var(--primary)] px-6 py-2 text-sm text-[var(--primary-foreground)]">저장</button>
        </form>
      ) : (
        <div className="rounded-lg border border-[var(--border)] p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div><span className="text-xs text-[var(--muted-foreground)]">상태</span><p><span className="rounded px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-700">{RESERVATION_STATUS_LABELS[reservation.status as ReservationStatus]}</span></p></div>
            <div><span className="text-xs text-[var(--muted-foreground)]">작업 유형</span><p className="font-medium">{reservation.serviceType}</p></div>
            <div><span className="text-xs text-[var(--muted-foreground)]">고객</span><p className="font-medium">{reservation.customer?.name}</p></div>
            <div><span className="text-xs text-[var(--muted-foreground)]">차량</span><p className="font-medium">{reservation.vehicle?.carModel || "-"}</p></div>
            <div><span className="text-xs text-[var(--muted-foreground)]">예약 일시</span><p className="font-medium">{formatDateTime(reservation.scheduledAt)}</p></div>
            <div><span className="text-xs text-[var(--muted-foreground)]">소요 시간</span><p className="font-medium">{reservation.duration}분</p></div>
          </div>
          {reservation.description && <div><span className="text-xs text-[var(--muted-foreground)]">작업 내용</span><p>{reservation.description}</p></div>}
          {reservation.memo && <div><span className="text-xs text-[var(--muted-foreground)]">메모</span><p>{reservation.memo}</p></div>}
          <div><span className="text-xs text-[var(--muted-foreground)]">Google Calendar</span><p className="text-sm">{reservation.calendarEventId ? "연동됨" : "미연동"}</p></div>
        </div>
      )}
    </div>
  );
}
