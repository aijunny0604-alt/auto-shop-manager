import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/auth/google/disconnect
export async function POST() {
  try {
    await prisma.googleToken.deleteMany();
    return NextResponse.json({ success: true, message: "Google 계정 연동이 해제되었습니다." });
  } catch (err) {
    console.error("Google 연동 해제 실패:", err);
    return NextResponse.json({ error: "연동 해제에 실패했습니다." }, { status: 500 });
  }
}
