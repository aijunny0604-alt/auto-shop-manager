import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSheetConnected, ensureSheets, fullSync } from "@/lib/google-sheets";

export async function POST() {
  if (!isSheetConnected()) {
    return NextResponse.json(
      { error: "Google Sheets가 연결되지 않았습니다." },
      { status: 400 }
    );
  }

  try {
    await ensureSheets();

    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { vehicles: true, reservations: true } } },
    });

    const reservations = await prisma.reservation.findMany({
      orderBy: { scheduledAt: "asc" },
      include: {
        customer: { select: { name: true, phone: true } },
        vehicle: { select: { carModel: true, plateNumber: true } },
      },
    });

    const result = await fullSync(customers, reservations);

    return NextResponse.json({ success: true, synced: result });
  } catch (err) {
    console.error("Google Sheets 동기화 실패:", err);
    return NextResponse.json(
      { error: "동기화에 실패했습니다." },
      { status: 500 }
    );
  }
}
