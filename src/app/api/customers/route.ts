import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncCustomerToSheet } from "@/lib/google-sheets";

// GET /api/customers
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  const customers = await prisma.customer.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search } },
            { phone: { contains: search } },
            { vehicles: { some: { plateNumber: { contains: search } } } },
            { vehicles: { some: { carModel: { contains: search } } } },
          ],
        }
      : {},
    orderBy: { updatedAt: "desc" },
    take: search ? 30 : 100,
    include: {
      vehicles: { select: { carModel: true, plateNumber: true }, take: 3 },
      _count: { select: { vehicles: true, reservations: true } },
    },
  });

  return NextResponse.json(customers);
}

// POST /api/customers
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, phone, memo, vehicle } = body;

  if (!name) {
    return NextResponse.json({ error: "이름은 필수입니다." }, { status: 400 });
  }

  const customer = await prisma.$transaction(async (tx) => {
    const c = await tx.customer.create({
      data: { name, phone: phone || null, memo: memo || null },
    });

    if (vehicle && vehicle.carModel) {
      await tx.vehicle.create({
        data: {
          customerId: c.id,
          carModel: vehicle.carModel,
          year: vehicle.year || null,
          plateNumber: vehicle.plateNumber || null,
          mileage: vehicle.mileage || null,
          memo: vehicle.memo || null,
        },
      });
    }

    return tx.customer.findUnique({
      where: { id: c.id },
      include: { vehicles: true, _count: { select: { vehicles: true, reservations: true } } },
    });
  });

  // Google Sheets 동기화 (비동기, 실패해도 무시)
  if (customer) {
    syncCustomerToSheet({ ...customer, createdAt: customer.createdAt.toISOString() }).catch((err) =>
      console.error("Sheets customer sync failed:", err)
    );
  }

  return NextResponse.json(customer, { status: 201 });
}
