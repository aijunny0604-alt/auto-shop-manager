import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCalendarEvent } from "@/lib/google-calendar";

// GET /api/reservations
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (from || to) {
    where.scheduledAt = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };
  }
  if (status) {
    where.status = status;
  }

  const reservations = await prisma.reservation.findMany({
    where,
    orderBy: { scheduledAt: "asc" },
    include: {
      customer: { select: { name: true, phone: true } },
      vehicle: { select: { carModel: true, plateNumber: true } },
    },
  });

  return NextResponse.json(reservations);
}

// POST /api/reservations
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { customerId, vehicleId, scheduledAt, duration, serviceType, description, memo } = body;

  if (!customerId || !scheduledAt || !serviceType) {
    return NextResponse.json(
      { error: "고객, 예약일시, 작업 유형은 필수입니다." },
      { status: 400 }
    );
  }

  // DB에 예약 저장
  const reservation = await prisma.reservation.create({
    data: {
      customerId,
      vehicleId: vehicleId || null,
      scheduledAt: new Date(scheduledAt),
      duration: duration || 60,
      serviceType,
      description: description || null,
      memo: memo || null,
    },
    include: {
      customer: { select: { name: true, phone: true } },
      vehicle: { select: { carModel: true, plateNumber: true } },
    },
  });

  // Google Calendar 이벤트 생성 시도
  const vehicleInfo = reservation.vehicle
    ? `${reservation.vehicle.carModel}${reservation.vehicle.plateNumber ? ` (${reservation.vehicle.plateNumber})` : ""}`
    : "";
  const summary = `[${serviceType}] ${reservation.customer.name}${vehicleInfo ? ` - ${vehicleInfo}` : ""}`;
  const descriptionText = [
    description,
    vehicleInfo && `차량: ${vehicleInfo}`,
    reservation.customer.phone && `연락처: ${reservation.customer.phone}`,
    memo && `메모: ${memo}`,
  ]
    .filter(Boolean)
    .join("\n");

  const calendarEventId = await createCalendarEvent({
    summary,
    description: descriptionText,
    startTime: scheduledAt,
    duration: duration || 60,
  });

  if (calendarEventId) {
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { calendarEventId },
    });
    reservation.calendarEventId = calendarEventId;
  }

  return NextResponse.json(reservation, { status: 201 });
}
