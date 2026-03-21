import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/backup/export
export async function GET() {
  try {
    const [
      customers,
      vehicles,
      serviceRecords,
      servicePartUsed,
      inventoryItems,
      stockLogs,
      reservations,
      estimates,
      estimateItems,
      importHistories,
    ] = await Promise.all([
      prisma.customer.findMany(),
      prisma.vehicle.findMany(),
      prisma.serviceRecord.findMany(),
      prisma.servicePartUsed.findMany(),
      prisma.inventoryItem.findMany(),
      prisma.stockLog.findMany(),
      prisma.reservation.findMany(),
      prisma.estimate.findMany(),
      prisma.estimateItem.findMany(),
      prisma.importHistory.findMany(),
    ]);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

    const backup = {
      exportedAt: now.toISOString(),
      version: "1.0",
      data: {
        customers,
        vehicles,
        serviceRecords,
        servicePartUsed,
        inventoryItems,
        stockLogs,
        reservations,
        estimates,
        estimateItems,
        importHistories,
      },
    };

    const json = JSON.stringify(backup, null, 2);

    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="bigs-motors-backup-${dateStr}.json"`,
      },
    });
  } catch (error) {
    console.error("Backup export failed:", error);
    return NextResponse.json(
      { error: "백업 내보내기에 실패했습니다." },
      { status: 500 }
    );
  }
}
