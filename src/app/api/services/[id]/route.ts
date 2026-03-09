import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/services/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const record = await prisma.serviceRecord.update({
    where: { id },
    data: {
      serviceDate: body.serviceDate ? new Date(body.serviceDate) : undefined,
      serviceType: body.serviceType,
      description: body.description,
      cost: body.cost !== undefined ? Number(body.cost) : undefined,
      memo: body.memo || null,
    },
  });

  return NextResponse.json(record);
}

// DELETE /api/services/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.serviceRecord.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
