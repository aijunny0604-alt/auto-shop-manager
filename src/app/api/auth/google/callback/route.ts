import { NextRequest, NextResponse } from "next/server";
import { exchangeCode } from "@/lib/google-calendar";

// GET /api/auth/google/callback
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", request.url));
  }

  try {
    await exchangeCode(code);
    return NextResponse.redirect(new URL("/?calendar=connected", request.url));
  } catch (err) {
    console.error("Google OAuth 실패:", err);
    return NextResponse.redirect(new URL("/?error=auth_failed", request.url));
  }
}
