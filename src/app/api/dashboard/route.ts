import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/dashboard
export async function GET() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);
  const weekEnd = new Date(todayStart.getTime() + 7 * 86400000);

  const [todayReservations, weekReservations, lowStockItems, recentServices, totalCustomers] =
    await Promise.all([
      // 오늘 예약
      prisma.reservation.findMany({
        where: {
          scheduledAt: { gte: todayStart, lt: todayEnd },
          status: { not: "CANCELLED" },
        },
        orderBy: { scheduledAt: "asc" },
        include: {
          customer: { select: { name: true, phone: true } },
          vehicle: { select: { carModel: true } },
        },
      }),
      // 이번 주 예약
      prisma.reservation.findMany({
        where: {
          scheduledAt: { gte: todayStart, lt: weekEnd },
          status: { not: "CANCELLED" },
        },
        orderBy: { scheduledAt: "asc" },
        include: {
          customer: { select: { name: true } },
          vehicle: { select: { carModel: true } },
        },
      }),
      // 재고 부족 - DB에서 직접 필터링 (raw query)
      prisma.$queryRaw`
        SELECT id, name, category, quantity, "minQuantity", "unitPrice", location, memo
        FROM "InventoryItem"
        WHERE quantity <= "minQuantity"
        ORDER BY quantity ASC
      `,
      // 최근 정비 5건
      prisma.serviceRecord.findMany({
        orderBy: { serviceDate: "desc" },
        take: 5,
        include: {
          vehicle: {
            select: {
              carModel: true,
              customer: { select: { name: true } },
            },
          },
        },
      }),
      // 총 고객 수 - 병렬 실행
      prisma.customer.count(),
    ]);

  return NextResponse.json({
    todayReservations,
    weekReservations,
    lowStockItems,
    recentServices,
    stats: {
      todayCount: todayReservations.length,
      weekCount: weekReservations.length,
      lowStockCount: (lowStockItems as unknown[]).length,
      totalCustomers,
    },
  });
}
