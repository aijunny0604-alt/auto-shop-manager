import { NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { isConnected, oauth2Client, saveToken } from "@/lib/google-calendar";

// POST /api/calendar/sync
export async function POST() {
  if (!(await isConnected())) {
    return NextResponse.json(
      { error: "Google Calendar에 연결되어 있지 않습니다. 먼저 OAuth 인증을 완료하세요." },
      { status: 401 }
    );
  }

  try {
    // Access token 자동 갱신 핸들러
    oauth2Client.on("tokens", (tokens) => {
      if (tokens.refresh_token || tokens.access_token) {
        saveToken(tokens as Record<string, unknown>);
      }
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // 오늘부터 30일 이후까지의 이벤트 조회
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const eventsResponse = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: thirtyDaysLater.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250,
    });

    const calendarEvents = eventsResponse.data.items ?? [];

    // 앱 DB의 예약 중 calendarEventId 가 없는 것들을 조회
    const reservationsWithoutEventId = await prisma.reservation.findMany({
      where: {
        calendarEventId: null,
        scheduledAt: {
          gte: now,
          lte: thirtyDaysLater,
        },
      },
      include: {
        customer: { select: { name: true } },
        vehicle: { select: { carModel: true } },
      },
    });

    // 캘린더 이벤트와 예약을 매핑
    let linked = 0;
    for (const reservation of reservationsWithoutEventId) {
      const expectedPrefix = `[${reservation.serviceType}] ${reservation.customer.name}`;
      const match = calendarEvents.find((ev) => {
        if (!ev.summary) return false;
        if (!ev.summary.startsWith(expectedPrefix)) return false;
        const evStart = ev.start?.dateTime ?? ev.start?.date;
        if (!evStart) return false;
        const diff = Math.abs(
          new Date(evStart).getTime() - new Date(reservation.scheduledAt).getTime()
        );
        return diff <= 5 * 60 * 1000;
      });

      if (match?.id) {
        await prisma.reservation.update({
          where: { id: reservation.id },
          data: { calendarEventId: match.id },
        });
        linked++;
      }
    }

    // 고아 예약 감지
    const reservationsWithEventId = await prisma.reservation.findMany({
      where: {
        calendarEventId: { not: null },
        scheduledAt: {
          gte: now,
          lte: thirtyDaysLater,
        },
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
      select: { id: true, calendarEventId: true },
    });

    const calendarEventIdSet = new Set(calendarEvents.map((ev) => ev.id));
    const orphanedReservationIds: string[] = [];

    for (const reservation of reservationsWithEventId) {
      if (reservation.calendarEventId && !calendarEventIdSet.has(reservation.calendarEventId)) {
        orphanedReservationIds.push(reservation.id);
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        calendarEventsFound: calendarEvents.length,
        reservationsLinked: linked,
        orphanedReservations: orphanedReservationIds.length,
        orphanedReservationIds,
      },
      message: `동기화 완료: ${calendarEvents.length}개 캘린더 이벤트 확인, ${linked}개 예약 연결, ${orphanedReservationIds.length}개 고아 예약 감지`,
    });
  } catch (err) {
    console.error("Google Calendar 동기화 실패:", err);
    return NextResponse.json(
      { error: "Google Calendar 동기화 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
