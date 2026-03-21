"use client";

import { useEffect, useState, useCallback } from "react";

// ── 타입 ──

interface RevenueSummary {
  totalRevenue: number;
  serviceCount: number;
  avgPerService: number;
  estimateTotal: number;
  estimateCount: number;
}

interface DailyRevenue {
  date: string;
  revenue: number;
  count: number;
}

interface ServiceTypeRevenue {
  type: string;
  revenue: number;
  count: number;
}

interface RevenueData {
  summary: RevenueSummary;
  daily: DailyRevenue[];
  byServiceType: ServiceTypeRevenue[];
}

type PeriodPreset = "today" | "week" | "month" | "3months" | "custom";

// ── 유틸 ──

function formatCurrency(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function toInputDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDateRange(preset: PeriodPreset): { from: string; to: string; period: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "today":
      return {
        from: toInputDate(today),
        to: toInputDate(today),
        period: "daily",
      };
    case "week": {
      const dayOfWeek = today.getDay();
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(today.getTime() - mondayOffset * 86400000);
      return {
        from: toInputDate(monday),
        to: toInputDate(today),
        period: "weekly",
      };
    }
    case "month":
      return {
        from: toInputDate(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: toInputDate(today),
        period: "monthly",
      };
    case "3months": {
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      return {
        from: toInputDate(threeMonthsAgo),
        to: toInputDate(today),
        period: "monthly",
      };
    }
    default:
      return {
        from: toInputDate(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: toInputDate(today),
        period: "monthly",
      };
  }
}

// ── 상단 요약 카드 관련 ──

interface SummaryCardsData {
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  avgPerService: number;
}

// ── 컴포넌트 ──

export default function RevenuePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RevenueData | null>(null);
  const [summaryCards, setSummaryCards] = useState<SummaryCardsData | null>(null);

  // 기간 필터 상태
  const [preset, setPreset] = useState<PeriodPreset>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // 상단 요약 카드 데이터 로드 (항상 오늘/이번주/이번달 기준)
  const loadSummaryCards = useCallback(async () => {
    try {
      const [todayRes, weekRes, monthRes] = await Promise.all([
        fetch("/api/revenue?period=daily").then((r) => r.json()),
        fetch("/api/revenue?period=weekly").then((r) => r.json()),
        fetch("/api/revenue?period=monthly").then((r) => r.json()),
      ]);
      setSummaryCards({
        todayRevenue: todayRes.summary?.totalRevenue ?? 0,
        weekRevenue: weekRes.summary?.totalRevenue ?? 0,
        monthRevenue: monthRes.summary?.totalRevenue ?? 0,
        avgPerService: monthRes.summary?.avgPerService ?? 0,
      });
    } catch {
      setSummaryCards({
        todayRevenue: 0,
        weekRevenue: 0,
        monthRevenue: 0,
        avgPerService: 0,
      });
    }
  }, []);

  // 선택 기간 데이터 로드
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let url: string;
      if (preset === "custom" && customFrom && customTo) {
        url = `/api/revenue?from=${customFrom}&to=${customTo}`;
      } else {
        const range = getDateRange(preset);
        url = `/api/revenue?from=${range.from}&to=${range.to}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [preset, customFrom, customTo]);

  useEffect(() => {
    loadSummaryCards();
  }, [loadSummaryCards]);

  useEffect(() => {
    if (preset !== "custom") {
      loadData();
    }
  }, [preset, loadData]);

  const handleCustomSearch = () => {
    if (customFrom && customTo) {
      loadData();
    }
  };

  const handlePresetChange = (newPreset: PeriodPreset) => {
    setPreset(newPreset);
    if (newPreset !== "custom") {
      setCustomFrom("");
      setCustomTo("");
    }
  };

  // 차트 계산
  const maxRevenue = data
    ? Math.max(...data.daily.map((d) => d.revenue), 1)
    : 1;

  const totalTypeRevenue = data
    ? data.byServiceType.reduce((sum, t) => sum + t.revenue, 0)
    : 0;

  // 일별 데이터가 너무 많으면 최근 31일만 표시
  const displayDaily = data
    ? data.daily.length > 31
      ? data.daily.slice(-31)
      : data.daily
    : [];

  const presetButtons: { key: PeriodPreset; label: string }[] = [
    { key: "today", label: "오늘" },
    { key: "week", label: "이번 주" },
    { key: "month", label: "이번 달" },
    { key: "3months", label: "3개월" },
    { key: "custom", label: "직접 입력" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">매출 관리</h1>

      {/* ── 상단 요약 카드 4개 ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-4">
          <p className="text-sm text-[var(--muted-foreground)]">오늘 매출</p>
          <p className="text-2xl md:text-3xl font-bold text-[var(--primary)] mt-1">
            {summaryCards ? formatCurrency(summaryCards.todayRevenue) : "-"}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-[var(--muted-foreground)]">이번 주 매출</p>
          <p className="text-2xl md:text-3xl font-bold mt-1">
            {summaryCards ? formatCurrency(summaryCards.weekRevenue) : "-"}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-[var(--muted-foreground)]">이번 달 매출</p>
          <p className="text-2xl md:text-3xl font-bold mt-1">
            {summaryCards ? formatCurrency(summaryCards.monthRevenue) : "-"}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-[var(--muted-foreground)]">건당 평균 매출</p>
          <p className="text-2xl md:text-3xl font-bold mt-1">
            {summaryCards ? formatCurrency(summaryCards.avgPerService) : "-"}
          </p>
        </div>
      </div>

      {/* ── 기간 필터 ── */}
      <div className="glass-card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {presetButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => handlePresetChange(btn.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                preset === btn.key
                  ? "glass-btn"
                  : "glass-btn-outline"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {preset === "custom" && (
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="glass-input rounded-lg px-3 py-2 text-sm"
            />
            <span className="text-[var(--muted-foreground)]">~</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="glass-input rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={handleCustomSearch}
              disabled={!customFrom || !customTo}
              className="glass-btn rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              조회
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-center py-10 text-[var(--muted-foreground)]">
          로딩 중...
        </p>
      ) : !data ? (
        <p className="text-center py-10 text-[var(--muted-foreground)]">
          데이터를 불러올 수 없습니다.
        </p>
      ) : (
        <>
          {/* ── 선택 기간 요약 ── */}
          <div className="glass-card p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  선택 기간 매출
                </p>
                <p className="text-2xl font-bold text-[var(--primary)]">
                  {formatCurrency(data.summary.totalRevenue)}
                </p>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  정비 {data.summary.serviceCount}건
                  {data.summary.estimateTotal > 0 && (
                    <> | 승인 견적 {formatCurrency(data.summary.estimateTotal)} ({data.summary.estimateCount}건)</>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* ── 일별 매출 차트 ── */}
          <div className="glass-card p-4 md:p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">일별 매출 추이</h2>
            {displayDaily.length === 0 ? (
              <p className="text-center py-8 text-[var(--muted-foreground)]">
                해당 기간에 매출 데이터가 없습니다.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <div
                  className="flex items-end gap-1"
                  style={{
                    minWidth: displayDaily.length > 14 ? `${displayDaily.length * 48}px` : undefined,
                    height: "280px",
                    paddingTop: "28px",
                  }}
                >
                  {displayDaily.map((day) => {
                    const heightPercent =
                      maxRevenue > 0
                        ? Math.max((day.revenue / maxRevenue) * 100, day.revenue > 0 ? 2 : 0)
                        : 0;
                    return (
                      <div
                        key={day.date}
                        className="flex-1 flex flex-col items-center justify-end"
                        style={{ minWidth: "36px" }}
                      >
                        {/* 금액 표시 */}
                        <span
                          className="text-xs text-[var(--muted-foreground)] mb-1 whitespace-nowrap"
                          style={{ fontSize: "10px" }}
                        >
                          {day.revenue > 0
                            ? day.revenue >= 10000
                              ? `${Math.round(day.revenue / 10000)}만`
                              : day.revenue.toLocaleString("ko-KR")
                            : ""}
                        </span>
                        {/* 막대 */}
                        <div
                          className="w-full rounded-t transition-all duration-300"
                          style={{
                            height: `${heightPercent}%`,
                            maxHeight: "220px",
                            background:
                              day.revenue > 0
                                ? "linear-gradient(to top, rgba(212, 184, 114, 0.6), rgba(212, 184, 114, 0.9))"
                                : "rgba(255,255,255,0.03)",
                            minHeight: day.revenue > 0 ? "4px" : "1px",
                            border: day.revenue > 0
                              ? "1px solid rgba(212, 184, 114, 0.4)"
                              : "1px solid rgba(255,255,255,0.05)",
                          }}
                          title={`${day.date}: ${formatCurrency(day.revenue)} (${day.count}건)`}
                        />
                        {/* 날짜 표시 */}
                        <span
                          className="text-xs text-[var(--muted-foreground)] mt-1 whitespace-nowrap"
                          style={{ fontSize: "10px" }}
                        >
                          {formatShortDate(day.date)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── 서비스 유형별 매출 테이블 ── */}
          <div className="glass-card mb-6">
            <h2 className="text-lg font-bold p-4 pb-2">
              서비스 유형별 매출
            </h2>
            {data.byServiceType.length === 0 ? (
              <p className="text-center py-8 text-[var(--muted-foreground)]">
                해당 기간에 유형별 데이터가 없습니다.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--muted)]">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium">
                        유형
                      </th>
                      <th className="px-4 py-2.5 text-right font-medium">
                        건수
                      </th>
                      <th className="px-4 py-2.5 text-right font-medium">
                        매출액
                      </th>
                      <th className="px-4 py-2.5 text-right font-medium">
                        비율
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byServiceType.map((item) => {
                      const percentage =
                        totalTypeRevenue > 0
                          ? ((item.revenue / totalTypeRevenue) * 100).toFixed(1)
                          : "0.0";
                      return (
                        <tr
                          key={item.type}
                          className="border-t border-[var(--border)]"
                        >
                          <td className="px-4 py-2.5">
                            <span className="glass-btn rounded px-2 py-0.5 text-xs">
                              {item.type}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right text-[var(--muted-foreground)]">
                            {item.count}건
                          </td>
                          <td className="px-4 py-2.5 text-right font-medium">
                            {formatCurrency(item.revenue)}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div
                                className="h-2 rounded-full"
                                style={{
                                  width: `${Math.max(parseFloat(percentage), 2)}%`,
                                  maxWidth: "80px",
                                  background: "rgba(212, 184, 114, 0.7)",
                                }}
                              />
                              <span className="text-[var(--muted-foreground)] w-12 text-right">
                                {percentage}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-[var(--muted)]">
                    <tr className="border-t border-[var(--border)]">
                      <td className="px-4 py-2.5 font-bold">합계</td>
                      <td className="px-4 py-2.5 text-right font-bold">
                        {data.byServiceType.reduce((s, t) => s + t.count, 0)}건
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold">
                        {formatCurrency(totalTypeRevenue)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-[var(--muted-foreground)]">
                        100%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
