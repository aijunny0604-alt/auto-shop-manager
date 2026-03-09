import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/inventory/[id]/stock - 입출고 기록
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { type, quantity, reason } = body;

  if (!type || !quantity || quantity <= 0) {
    return NextResponse.json(
      { error: "유형과 수량(양수)은 필수입니다." },
      { status: 400 }
    );
  }

  if (type !== "IN" && type !== "OUT") {
    return NextResponse.json(
      { error: "유형은 IN 또는 OUT이어야 합니다." },
      { status: 400 }
    );
  }

  const item = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json(
      { error: "부품을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (type === "OUT" && item.quantity < quantity) {
    return NextResponse.json(
      { error: `재고가 부족합니다. (현재: ${item.quantity}개)` },
      { status: 400 }
    );
  }

  const [log] = await prisma.$transaction([
    prisma.stockLog.create({
      data: {
        inventoryItemId: id,
        type,
        quantity,
        reason: reason || null,
      },
    }),
    prisma.inventoryItem.update({
      where: { id },
      data: {
        quantity: type === "IN" ? item.quantity + quantity : item.quantity - quantity,
      },
    }),
  ]);

  return NextResponse.json(log, { status: 201 });
}
