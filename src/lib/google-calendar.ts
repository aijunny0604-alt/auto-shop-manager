import { google } from "googleapis";
import fs from "fs";
import path from "path";

const TOKEN_PATH = path.join(process.cwd(), "prisma", "google-token.json");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// 저장된 토큰 로드
function loadToken(): boolean {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
      oauth2Client.setCredentials(token);
      return true;
    }
  } catch {
    // 토큰 로드 실패
  }
  return false;
}

// 토큰 저장
export function saveToken(tokens: Record<string, unknown>) {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  oauth2Client.setCredentials(tokens as Parameters<typeof oauth2Client.setCredentials>[0]);
}

// OAuth URL 생성
export function getAuthUrl(): string {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar"],
    prompt: "consent",
  });
}

// 인증 코드로 토큰 교환
export async function exchangeCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  saveToken(tokens as Record<string, unknown>);
  return tokens;
}

// Calendar API 인스턴스
function getCalendar() {
  loadToken();
  return google.calendar({ version: "v3", auth: oauth2Client });
}

// 연결 상태 확인
export function isConnected(): boolean {
  return loadToken();
}

// 이벤트 생성
export async function createCalendarEvent(data: {
  summary: string;
  description: string;
  startTime: string;
  duration: number;
}): Promise<string | null> {
  if (!loadToken()) return null;

  try {
    const calendar = getCalendar();
    const start = new Date(data.startTime);
    const end = new Date(start.getTime() + data.duration * 60000);

    const event = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: data.summary,
        description: data.description,
        start: { dateTime: start.toISOString(), timeZone: "Asia/Seoul" },
        end: { dateTime: end.toISOString(), timeZone: "Asia/Seoul" },
      },
    });

    return event.data.id || null;
  } catch (err) {
    console.error("Google Calendar 이벤트 생성 실패:", err);
    return null;
  }
}

// 이벤트 수정
export async function updateCalendarEvent(
  eventId: string,
  data: {
    summary: string;
    description: string;
    startTime: string;
    duration: number;
  }
): Promise<boolean> {
  if (!loadToken()) return false;

  try {
    const calendar = getCalendar();
    const start = new Date(data.startTime);
    const end = new Date(start.getTime() + data.duration * 60000);

    await calendar.events.update({
      calendarId: "primary",
      eventId,
      requestBody: {
        summary: data.summary,
        description: data.description,
        start: { dateTime: start.toISOString(), timeZone: "Asia/Seoul" },
        end: { dateTime: end.toISOString(), timeZone: "Asia/Seoul" },
      },
    });

    return true;
  } catch (err) {
    console.error("Google Calendar 이벤트 수정 실패:", err);
    return false;
  }
}

// 이벤트 삭제
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  if (!loadToken()) return false;

  try {
    const calendar = getCalendar();
    await calendar.events.delete({
      calendarId: "primary",
      eventId,
    });
    return true;
  } catch (err) {
    console.error("Google Calendar 이벤트 삭제 실패:", err);
    return false;
  }
}
