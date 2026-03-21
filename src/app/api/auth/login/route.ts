import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "bigsmotors2026";
const SESSION_NAME = "bigs-session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30일

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "비밀번호가 틀렸습니다." }, { status: 401 });
    }

    // 간단한 세션 토큰 (비밀번호 해시 기반)
    const token = Buffer.from(`${ADMIN_PASSWORD}-${Date.now()}`).toString("base64");

    const cookieStore = await cookies();
    cookieStore.set(SESSION_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "로그인 실패" }, { status: 500 });
  }
}
