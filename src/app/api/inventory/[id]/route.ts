import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/inventory/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      stockLogs: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!item) {
    return NextResponse.json(
      { error: "부품을 찾을 수 없습니다." },
      { status: 404 }
    );
  }
  return NextResponse.json(item);
}

// PUT /api/inventory/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const item = await prisma.inventoryItem.update({
    where: { id },
    data: {
      name: body.name,
      category: body.category,
      quantity: body.quantity,
      minQuantity: body.minQuantity,
      unitPrice: body.unitPrice,
      location: body.location || null,
      memo: body.memo || null,
    },
  });

  return NextResponse.json(item);
}

// DELETE /api/inventory/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.inventoryItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
