"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDateTime, formatCurrency } from "@/lib/utils";

interface DashboardData {
  todayReservations: Array<{
    id: string;
    scheduledAt: string;
    serviceType: string;
    status: string;
    duration: number;
    description: string | null;
    customer: { name: string; phone: string | null };
    vehicle: { carModel: string } | null;
  }>;
  lowStockItems: Array<{
    id: string;
    name: string;
    category: string;
    quantity: number;
    minQuantity: number;
  }>;
  recentServices: Array<{
    id: string;
    serviceDate: string;
    serviceType: string;
    description: string;
    cost: number;
    vehicle: {
      carModel: string;
      customer: { name: string };
    };
  }>;
  stats: {
    todayCount: number;
    weekCount: number;
    lowStockCount: number;
    totalCustomers: number;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setData({
          todayReservations: [],
          lowStockItems: [],
          recentServices: [],
          stats: { todayCount: 0, weekCount: 0, lowStockCount: 0, totalCustomers: 0 },
        });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="text-[var(--muted-foreground)]">로딩 중...</p>;
  }

  if (!data) return null;

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    CONFIRMED: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
  };

  const statusLabels: Record<string, string> = {
    PENDING: "대기",
    CONFIRMED: "확정",
    COMPLETED: "완료",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">대시보드</h1>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-lg border border-[var(--border)] p-4">
          <p className="text-sm text-[var(--muted-foreground)]">오늘 예약</p>
          <p className="text-3xl font-bold text-[var(--primary)]">{data.stats.todayCount}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-4">
          <p className="text-sm text-[var(--muted-foreground)]">이번 주 예약</p>
          <p className="text-3xl font-bold">{data.stats.weekCount}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-4">
          <p className="text-sm text-[var(--muted-foreground)]">재고 부족</p>
          <p className={`text-3xl font-bold ${data.stats.lowStockCount > 0 ? "text-[var(--destructive)]" : ""}`}>
            {data.stats.lowStockCount}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-4">
          <p className="text-sm text-[var(--muted-foreground)]">전체 고객</p>
          <p className="text-3xl font-bold">{data.stats.totalCustomers}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 오늘 예약 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">오늘의 예약</h2>
            <Link href="/reservations" className="text-sm text-[var(--primary)] hover:underline">
              전체 보기
            </Link>
          </div>
          {data.todayReservations.length === 0 ? (
            <div className="rounded-lg border border-[var(--border)] p-6 text-center text-[var(--muted-foreground)]">
              오늘 예약이 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {data.todayReservations.map((r) => (
                <Link
                  key={r.id}
                  href={`/reservations/${r.id}`}
                  className="block rounded-lg border border-[var(--border)] p-3 hover:bg-[var(--accent)] transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${statusColors[r.status] || ""}`}>
                      {statusLabels[r.status] || r.status}
                    </span>
                    <span className="font-medium text-sm">
                      [{r.serviceType}] {r.customer.name}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {formatDateTime(r.scheduledAt)} ({r.duration}분)
                    {r.vehicle && ` | ${r.vehicle.carModel}`}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 재고 부족 알림 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">재고 부족 알림</h2>
            <Link href="/inventory" className="text-sm text-[var(--primary)] hover:underline">
              전체 보기
            </Link>
          </div>
          {data.lowStockItems.length === 0 ? (
            <div className="rounded-lg border border-[var(--border)] p-6 text-center text-[var(--muted-foreground)]">
              부족한 재고가 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {data.lowStockItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/inventory/${item.id}`}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3 hover:bg-[var(--accent)] transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[var(--destructive)]">{item.quantity}개</p>
                    <p className="text-xs text-[var(--muted-foreground)]">최소 {item.minQuantity}개</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 최근 정비 내역 */}
        <div className="md:col-span-2">
          <h2 className="text-lg font-bold mb-3">최근 정비 내역</h2>
          {data.recentServices.length === 0 ? (
            <div className="rounded-lg border border-[var(--border)] p-6 text-center text-[var(--muted-foreground)]">
              정비 이력이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">날짜</th>
                    <th className="px-4 py-2 text-left font-medium">고객</th>
                    <th className="px-4 py-2 text-left font-medium">차량</th>
                    <th className="px-4 py-2 text-left font-medium">유형</th>
                    <th className="px-4 py-2 text-left font-medium">내용</th>
                    <th className="px-4 py-2 text-right font-medium">비용</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentServices.map((s) => (
                    <tr key={s.id} className="border-t border-[var(--border)]">
                      <td className="px-4 py-2 text-[var(--muted-foreground)]">{new Date(s.serviceDate).toLocaleDateString("ko-KR")}</td>
                      <td className="px-4 py-2">{s.vehicle.customer.name}</td>
                      <td className="px-4 py-2">{s.vehicle.carModel}</td>
                      <td className="px-4 py-2"><span className="rounded bg-[var(--primary)] px-1.5 py-0.5 text-xs text-[var(--primary-foreground)]">{s.serviceType}</span></td>
                      <td className="px-4 py-2">{s.description}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(s.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
