import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/estimates/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const estimate = await prisma.estimate.findUnique({
    where: { id },
    include: {
      customer: { select: { name: true, phone: true } },
      vehicle: {
        select: { carModel: true, plateNumber: true, year: true, mileage: true },
      },
      items: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!estimate) {
    return NextResponse.json({ error: "견적서를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json(estimate);
}

// PUT /api/estimates/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const { status, items, discount, memo, validUntil, customerId, vehicleId } = body;

  try {
    const estimate = await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {};

      if (status) updateData.status = status;
      if (memo !== undefined) updateData.memo = memo;
      if (discount !== undefined) updateData.discount = discount;
      if (validUntil !== undefined)
        updateData.validUntil = validUntil ? new Date(validUntil) : null;
      if (customerId) updateData.customerId = customerId;
      if (vehicleId !== undefined) updateData.vehicleId = vehicleId || null;

      // 항목 변경 시 전부 교체
      if (items && Array.isArray(items)) {
        await tx.estimateItem.deleteMany({ where: { estimateId: id } });
        await Promise.all(
          items.map(
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
            ) =>
              tx.estimateItem.create({
                data: {
                  estimateId: id,
                  type: item.type,
                  name: item.name,
                  inventoryItemId: item.inventoryItemId || null,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  amount: item.quantity * item.unitPrice,
                  memo: item.memo || null,
                  sortOrder: idx,
                },
              })
          )
        );

        const itemsTotal = items.reduce(
          (sum: number, item: { quantity: number; unitPrice: number }) =>
            sum + item.quantity * item.unitPrice,
          0
        );
        updateData.totalAmount = Math.max(
          0,
          itemsTotal - (discount ?? 0)
        );
      }

      return tx.estimate.update({
        where: { id },
        data: updateData,
        include: {
          customer: { select: { name: true, phone: true } },
          vehicle: { select: { carModel: true, plateNumber: true } },
          items: { orderBy: { sortOrder: "asc" } },
        },
      });
    });

    return NextResponse.json(estimate);
  } catch (err) {
    console.error("견적서 수정 실패:", err);
    return NextResponse.json({ error: "견적서 수정에 실패했습니다." }, { status: 500 });
  }
}

// DELETE /api/estimates/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.estimate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  }
}
