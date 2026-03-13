"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface CalendarEvent {
  id: string;
  summary: string;
  description: string;
  start: string;
  end: string;
  allDay: boolean;
}

function formatTime(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
}

function formatFullDate(date: Date) {
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
}

function isSameDay(a: string, b: Date) {
  const d = new Date(a);
  return d.getFullYear() === b.getFullYear() && d.getMonth() === b.getMonth() && d.getDate() === b.getDate();
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"list" | "month">("month");
  const [selectedDay, setSelectedDay] = useState<{ date: Date; events: CalendarEvent[] } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const from = new Date(year, month, 1).toISOString();
      const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      const res = await fetch(`/api/calendar/events?from=${from}&to=${to}`);
      if (res.status === 401) {
        setConnected(false);
        setEvents([]);
      } else if (res.ok) {
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
        setConnected(true);
      } else {
        setEvents([]);
      }
    } catch {
      setEvents([]);
    }
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const goMonth = (delta: number) => {
    setCurrentDate(new Date(year, month + delta, 1));
  };

  const goToday = () => setCurrentDate(new Date());

  const handleDayClick = (day: number, dayEvents: CalendarEvent[]) => {
    setSelectedDay({ date: new Date(year, month, day), events: dayEvents });
  };

  // 월별 날짜별 이벤트 그룹 (YYYY-MM-DD 키로 정렬 보장)
  const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>((acc, e) => {
    const d = new Date(e.start);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  // 달력 그리드 생성
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);
  const totalRows = Math.ceil(calendarDays.length / 7);

  if (!connected) {
    return (
      <div className="text-center py-12">
        <p className="text-lg mb-4">Google Calendar 연결이 필요합니다.</p>
        <a
          href="/api/auth/google"
          className="inline-block rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
        >
          Google Calendar 연결하기
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Google Calendar</h1>
        <div className="flex gap-2">
          <Link
            href="/reservations/new"
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
          >
            + 예약 등록
          </Link>
        </div>
      </div>

      {/* 네비게이션 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => goMonth(-1)} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--accent)]">
            &lt;
          </button>
          <h2 className="text-lg font-bold min-w-[140px] text-center">
            {year}년 {month + 1}월
          </h2>
          <button onClick={() => goMonth(1)} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--accent)]">
            &gt;
          </button>
          <button onClick={goToday} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--accent)]">
            오늘
          </button>
        </div>
        <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
          <button
            onClick={() => setViewMode("month")}
            className={`px-3 py-1.5 text-sm ${viewMode === "month" ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "hover:bg-[var(--accent)]"}`}
          >
            달력
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 text-sm ${viewMode === "list" ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "hover:bg-[var(--accent)]"}`}
          >
            목록
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-[var(--muted-foreground)]">일정 불러오는 중...</p>
      ) : viewMode === "month" ? (
        /* 월간 달력 뷰 */
        <div className="rounded-lg border border-[var(--border)] overflow-hidden flex flex-col" style={{ height: `calc(100vh - 200px)` }}>
          <div className="grid grid-cols-7 bg-[var(--muted)] shrink-0">
            {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
              <div key={d} className={`px-2 py-2 text-center text-sm font-medium ${d === "일" ? "text-red-500" : d === "토" ? "text-blue-500" : ""}`}>
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 flex-1" style={{ gridTemplateRows: `repeat(${totalRows}, 1fr)` }}>
            {calendarDays.map((day, i) => {
              const isToday = day ? new Date(year, month, day).toDateString() === today.toDateString() : false;
              const dayEvents = day ? events.filter((e) => isSameDay(e.start, new Date(year, month, day))) : [];
              return (
                <div
                  key={i}
                  onClick={() => day && handleDayClick(day, dayEvents)}
                  className={`border-t border-r border-[var(--border)] p-2 overflow-hidden ${!day ? "bg-[var(--muted)]/30" : "cursor-pointer hover:bg-[var(--accent)]/50 transition-colors"} ${i % 7 === 0 ? "border-l-0" : ""}`}
                >
                  {day && (
                    <>
                      <div className={`text-sm mb-1 ${isToday ? "bg-[var(--primary)] text-[var(--primary-foreground)] rounded-full w-7 h-7 flex items-center justify-center font-bold" : i % 7 === 0 ? "text-red-500" : i % 7 === 6 ? "text-blue-500" : "text-[var(--muted-foreground)]"}`}>
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((e) => (
                          <div
                            key={e.id}
                            className="truncate rounded bg-[var(--primary)]/10 px-1.5 py-0.5 text-xs leading-snug text-[var(--primary)]"
                          >
                            {e.summary}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-[var(--muted-foreground)] pl-1">+{dayEvents.length - 3}개</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 목록 뷰 */
        events.length === 0 ? (
          <div className="rounded-lg border border-[var(--border)] p-8 text-center text-[var(--muted-foreground)]">
            이번 달 일정이 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(eventsByDate).map(([dateStr, dayEvents]) => (
              <div key={dateStr}>
                <h3 className="text-sm font-bold text-[var(--muted-foreground)] mb-2">
                  {formatDate(dayEvents[0].start)}
                </h3>
                <div className="space-y-2">
                  {dayEvents.map((e) => (
                    <div
                      key={e.id}
                      className="rounded-lg border border-[var(--border)] p-3 hover:bg-[var(--accent)] transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{e.summary}</p>
                          {e.description && (
                            <p className="text-sm text-[var(--muted-foreground)] mt-1 whitespace-pre-line">
                              {e.description}
                            </p>
                          )}
                        </div>
                        <div className="text-sm text-[var(--muted-foreground)] whitespace-nowrap ml-3">
                          {e.allDay ? "종일" : `${formatTime(e.start)} ~ ${formatTime(e.end)}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* 날짜 상세 모달 */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedDay(null)} />
          <div className="relative z-50 w-full max-w-lg mx-4 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <h3 className="text-lg font-bold">{formatFullDate(selectedDay.date)}</h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="rounded-lg p-1 text-xl text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
              >
                ✕
              </button>
            </div>

            {/* 일정 목록 */}
            <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
              {selectedDay.events.length === 0 ? (
                <p className="text-center text-[var(--muted-foreground)] py-6">이 날 일정이 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {selectedDay.events.map((e) => (
                    <div key={e.id} className="rounded-lg border border-[var(--border)] p-4">
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-bold text-base">{e.summary}</p>
                        <span className="shrink-0 ml-3 rounded bg-[var(--primary)]/10 px-2 py-0.5 text-xs font-medium text-[var(--primary)]">
                          {e.allDay ? "종일" : `${formatTime(e.start)} ~ ${formatTime(e.end)}`}
                        </span>
                      </div>
                      {e.description && (
                        <p className="text-sm text-[var(--muted-foreground)] whitespace-pre-line mt-2 leading-relaxed">
                          {e.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 하단 버튼 */}
            <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-3">
              <Link
                href="/reservations/new"
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
                onClick={() => setSelectedDay(null)}
              >
                + 예약 등록
              </Link>
              <button
                onClick={() => setSelectedDay(null)}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--accent)]"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
