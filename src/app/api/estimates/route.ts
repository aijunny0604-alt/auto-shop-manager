import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/estimates
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { estimateNo: { contains: search } },
      { customer: { name: { contains: search } } },
    ];
  }
  if (status) {
    where.status = status;
  }

  const estimates = await prisma.estimate.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      customer: { select: { name: true, phone: true } },
      vehicle: { select: { carModel: true, plateNumber: true } },
      _count: { select: { items: true } },
    },
  });

  return NextResponse.json(estimates);
}

// POST /api/estimates
export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const { customerId, vehicleId, items, discount, memo, validUntil } = body;

  if (!customerId) {
    return NextResponse.json({ error: "고객은 필수입니다." }, { status: 400 });
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "항목을 1개 이상 추가해주세요." }, { status: 400 });
  }

  try {
    const estimate = await prisma.$transaction(async (tx) => {
      // 견적번호 생성: EST-YYYYMMDD-NNN
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const count = await tx.estimate.count({
        where: { estimateNo: { startsWith: `EST-${today}` } },
      });
      const estimateNo = `EST-${today}-${String(count + 1).padStart(3, "0")}`;

      // 합계 계산
      const itemsTotal = items.reduce(
        (sum: number, item: { quantity: number; unitPrice: number }) =>
          sum + item.quantity * item.unitPrice,
        0
      );
      const totalAmount = Math.max(0, itemsTotal - (discount || 0));

      const created = await tx.estimate.create({
        data: {
          estimateNo,
          customerId,
          vehicleId: vehicleId || null,
          discount: discount || 0,
          totalAmount,
          memo: memo || null,
          validUntil: validUntil ? new Date(validUntil) : null,
          items: {
            create: items.map(
              (
                item: {
                  type: string;
                  name: string;
                  inventoryItemId?: string;
                  quantity: number;
                  unitPrice: number;
                  memo?: string;
                },
                idx: number
              ) => ({
                type: item.type,
                name: item.name,
                inventoryItemId: item.inventoryItemId || null,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                amount: item.quantity * item.unitPrice,
                memo: item.memo || null,
                sortOrder: idx,
              })
            ),
          },
        },
        include: {
          customer: { select: { name: true, phone: true } },
          vehicle: { select: { carModel: true, plateNumber: true } },
          items: { orderBy: { sortOrder: "asc" } },
        },
      });

      return created;
    });

    return NextResponse.json(estimate, { status: 201 });
  } catch (err) {
    console.error("견적서 생성 실패:", err);
    return NextResponse.json({ error: "견적서 생성에 실패했습니다." }, { status: 500 });
  }
}
