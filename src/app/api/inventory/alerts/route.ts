import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/inventory/alerts - 재고 부족 목록
export async function GET() {
  const items = await prisma.inventoryItem.findMany({
    where: {
      quantity: { lte: prisma.inventoryItem.fields.minQuantity } as never,
    },
    orderBy: { quantity: "asc" },
  });

  // Prisma SQLite에서 필드 비교가 어렵므로 앱 레벨에서 필터
  const allItems = await prisma.inventoryItem.findMany({
    orderBy: { quantity: "asc" },
  });

  const lowStockItems = allItems.filter(
    (item: { quantity: number; minQuantity: number }) => item.quantity <= item.minQuantity
  );

  return NextResponse.json(lowStockItems);
}
