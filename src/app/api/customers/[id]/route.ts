import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/customers/[id] - 고객 상세 (차량 + 이력 포함)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      vehicles: {
        orderBy: { updatedAt: "desc" },
        include: {
          serviceRecords: {
            orderBy: { serviceDate: "desc" },
            include: {
              partsUsed: {
                include: { inventoryItem: { select: { name: true, category: true } } },
              },
            },
          },
        },
      },
      reservations: {
        orderBy: { scheduledAt: "desc" },
        take: 5,
      },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "고객을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json(customer);
}

// PUT /api/customers/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      name: body.name,
      phone: body.phone || null,
      memo: body.memo || null,
    },
  });

  return NextResponse.json(customer);
}

// DELETE /api/customers/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
