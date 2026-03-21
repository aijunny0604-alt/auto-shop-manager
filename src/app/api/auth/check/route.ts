import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// GET /api/auth/check
export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("bigs-session");
  return NextResponse.json({ authenticated: !!session?.value });
}
