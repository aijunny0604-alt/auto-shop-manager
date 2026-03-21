import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/revenue?period=daily|weekly|monthly&from=날짜&to=날짜
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const period = searchParams.get("period") || "monthly";
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 기간 계산
  let from: Date;
  let to: Date;

  if (fromParam && toParam) {
    from = new Date(fromParam);
    to = new Date(toParam);
    // to는 해당 날짜의 끝까지 포함
    to = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1);
  } else {
    to = new Date(todayStart.getTime() + 86400000); // 내일 0시
    switch (period) {
      case "daily":
        from = todayStart;
        break;
      case "weekly": {
        const dayOfWeek = todayStart.getDay(); // 0=일요일
        const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        from = new Date(todayStart.getTime() - mondayOffset * 86400000);
        break;
      }
      case "monthly":
      default:
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }
  }

  try {
    // 병렬 실행: 전체 집계, 일별 집계, 유형별 집계, 견적 집계
    const [totalAgg, serviceRecords, byServiceType, estimateAgg] =
      await Promise.all([
        // 1) 전체 매출 합계 및 건수
        prisma.serviceRecord.aggregate({
          where: {
            serviceDate: { gte: from, lt: to },
          },
          _sum: { cost: true },
          _count: { id: true },
          _avg: { cost: true },
        }),

        // 2) 기간 내 모든 서비스 레코드 (일별 집계용)
        prisma.serviceRecord.findMany({
          where: {
            serviceDate: { gte: from, lt: to },
          },
          select: {
            serviceDate: true,
            cost: true,
          },
          orderBy: { serviceDate: "asc" },
        }),

        // 3) 서비스 유형별 집계
        prisma.serviceRecord.groupBy({
          by: ["serviceType"],
          where: {
            serviceDate: { gte: from, lt: to },
          },
          _sum: { cost: true },
          _count: { id: true },
        }),

        // 4) 승인된 견적서 합계
        prisma.estimate.aggregate({
          where: {
            status: "APPROVED",
            createdAt: { gte: from, lt: to },
          },
          _sum: { totalAmount: true },
          _count: { id: true },
        }),
      ]);

    // 일별 집계 계산
    const dailyMap = new Map<string, { revenue: number; count: number }>();
    for (const record of serviceRecords) {
      const dateKey = new Date(record.serviceDate)
        .toISOString()
        .split("T")[0];
      const existing = dailyMap.get(dateKey) || { revenue: 0, count: 0 };
      existing.revenue += record.cost;
      existing.count += 1;
      dailyMap.set(dateKey, existing);
    }

    // 기간 내 모든 날짜를 채워서 빈 날짜도 표시
    const daily: Array<{ date: string; revenue: number; count: number }> = [];
    const currentDate = new Date(from);
    const endDate = new Date(to);
    while (currentDate < endDate) {
      const dateKey = currentDate.toISOString().split("T")[0];
      const data = dailyMap.get(dateKey) || { revenue: 0, count: 0 };
      daily.push({ date: dateKey, ...data });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 유형별 집계 정리
    const totalRevenue = totalAgg._sum.cost || 0;
    const byServiceTypeResult = byServiceType.map((item) => ({
      type: item.serviceType,
      revenue: item._sum.cost || 0,
      count: item._count.id,
    }));

    // 비율 내림차순 정렬
    byServiceTypeResult.sort((a, b) => b.revenue - a.revenue);

    const response = {
      summary: {
        totalRevenue,
        serviceCount: totalAgg._count.id,
        avgPerService: Math.round(totalAgg._avg.cost || 0),
        estimateTotal: estimateAgg._sum.totalAmount || 0,
        estimateCount: estimateAgg._count.id,
      },
      daily,
      byServiceType: byServiceTypeResult,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Revenue API error:", error);
    return NextResponse.json(
      { error: "매출 데이터 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
