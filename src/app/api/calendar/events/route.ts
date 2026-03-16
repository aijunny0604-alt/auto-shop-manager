import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { oauth2Client, loadToken } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  if (!(await loadToken())) {
    return NextResponse.json({ error: "Google Calendar 인증이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  // 날짜 유효성 검증
  const timeMin = fromParam && !isNaN(Date.parse(fromParam)) ? fromParam : new Date().toISOString();
  const timeMax = toParam && !isNaN(Date.parse(toParam)) ? toParam : new Date(Date.now() + 30 * 86400000).toISOString();

  try {
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const res = await calendar.events.list({
      calendarId: "primary",
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 100,
    });

    const events = (res.data.items || []).map((e) => ({
      id: e.id,
      summary: e.summary || "(제목 없음)",
      description: e.description || "",
      start: e.start?.dateTime || e.start?.date || "",
      end: e.end?.dateTime || e.end?.date || "",
      allDay: !e.start?.dateTime,
    }));

    return NextResponse.json(events);
  } catch (err) {
    console.error("Calendar events fetch failed:", err);
    return NextResponse.json({ error: "일정을 가져오지 못했습니다." }, { status: 500 });
  }
}
