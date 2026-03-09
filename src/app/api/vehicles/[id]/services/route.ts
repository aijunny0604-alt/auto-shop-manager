import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/vehicles/[id]/services - 정비 이력 등록
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { serviceDate, serviceType, description, cost, memo, partsUsed } = body;

  if (!serviceDate || !serviceType || !description) {
    return NextResponse.json(
      { error: "정비일, 유형, 내용은 필수입니다." },
      { status: 400 }
    );
  }

  const record = await prisma.serviceRecord.create({
    data: {
      vehicleId: id,
      serviceDate: new Date(serviceDate),
      serviceType,
      description,
      cost: Number(cost) || 0,
      memo: memo || null,
      partsUsed: partsUsed?.length
        ? {
            create: partsUsed.map(
              (p: { inventoryItemId: string; quantity: number }) => ({
                inventoryItemId: p.inventoryItemId,
                quantity: p.quantity,
              })
            ),
          }
        : undefined,
    },
    include: {
      partsUsed: {
        include: { inventoryItem: { select: { name: true } } },
      },
    },
  });

  // 사용 부품 재고 차감
  if (partsUsed?.length) {
    for (const p of partsUsed as { inventoryItemId: string; quantity: number }[]) {
      await prisma.inventoryItem.update({
        where: { id: p.inventoryItemId },
        data: { quantity: { decrement: p.quantity } },
      });
      await prisma.stockLog.create({
        data: {
          inventoryItemId: p.inventoryItemId,
          type: "OUT",
          quantity: p.quantity,
          reason: `정비 이력: ${description}`,
        },
      });
    }
  }

  return NextResponse.json(record, { status: 201 });
}
