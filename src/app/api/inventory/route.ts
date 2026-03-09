import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/inventory - 재고 목록 (검색/필터)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.name = { contains: search };
  }
  if (category) {
    where.category = category;
  }

  const items = await prisma.inventoryItem.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { stockLogs: true } } },
  });

  return NextResponse.json(items);
}

// POST /api/inventory - 부품 등록
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, category, quantity, minQuantity, unitPrice, location, memo } =
    body;

  if (!name || !category) {
    return NextResponse.json(
      { error: "이름과 카테고리는 필수입니다." },
      { status: 400 }
    );
  }

  const item = await prisma.inventoryItem.create({
    data: {
      name,
      category,
      quantity: quantity ?? 0,
      minQuantity: minQuantity ?? 5,
      unitPrice: unitPrice ?? 0,
      location: location || null,
      memo: memo || null,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
