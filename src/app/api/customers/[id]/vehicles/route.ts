import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/customers/[id]/vehicles
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { carModel, year, plateNumber, mileage, memo } = body;

  if (!carModel) {
    return NextResponse.json({ error: "차종은 필수입니다." }, { status: 400 });
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      customerId: id,
      carModel,
      year: year ? Number(year) : null,
      plateNumber: plateNumber || null,
      mileage: mileage ? Number(mileage) : null,
      memo: memo || null,
    },
  });

  return NextResponse.json(vehicle, { status: 201 });
}
