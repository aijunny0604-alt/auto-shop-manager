import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/vehicles/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: {
      carModel: body.carModel,
      year: body.year ? Number(body.year) : null,
      plateNumber: body.plateNumber || null,
      mileage: body.mileage ? Number(body.mileage) : null,
      memo: body.memo || null,
    },
  });

  return NextResponse.json(vehicle);
}

// DELETE /api/vehicles/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.vehicle.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
