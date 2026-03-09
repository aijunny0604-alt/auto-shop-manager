import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/google-calendar";

// GET /api/auth/google - Google OAuth 시작
export async function GET() {
  const url = getAuthUrl();
  return NextResponse.redirect(url);
}
