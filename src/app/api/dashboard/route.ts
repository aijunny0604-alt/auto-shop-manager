import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/dashboard
export async function GET() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);
  const weekEnd = new Date(todayStart.getTime() + 7 * 86400000);

  const [todayReservations, weekReservations, allItems, recentServices] =
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
      // 재고 부족 (앱 레벨 필터)
      prisma.inventoryItem.findMany({
        orderBy: { quantity: "asc" },
      }),
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
    ]);

  const lowStockItems = allItems.filter((i) => i.quantity <= i.minQuantity);

  return NextResponse.json({
    todayReservations,
    weekReservations,
    lowStockItems,
    recentServices,
    stats: {
      todayCount: todayReservations.length,
      weekCount: weekReservations.length,
      lowStockCount: lowStockItems.length,
      totalCustomers: await prisma.customer.count(),
    },
  });
}
