import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncCustomerToSheet } from "@/lib/google-sheets";

// GET /api/customers
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  const customers = await prisma.customer.findMany({
    where: search ? { name: { contains: search } } : {},
    orderBy: { updatedAt: "desc" },
    take: search ? 15 : 100,
    include: {
      _count: { select: { vehicles: true, reservations: true } },
    },
  });

  return NextResponse.json(customers);
}

// POST /api/customers
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, phone, memo } = body;

  if (!name) {
    return NextResponse.json({ error: "이름은 필수입니다." }, { status: 400 });
  }

  const customer = await prisma.customer.create({
    data: { name, phone: phone || null, memo: memo || null },
  });

  // Google Sheets 동기화 (비동기, 실패해도 무시)
  syncCustomerToSheet({ ...customer, createdAt: customer.createdAt.toISOString() }).catch((err) =>
    console.error("Sheets customer sync failed:", err)
  );

  return NextResponse.json(customer, { status: 201 });
}
