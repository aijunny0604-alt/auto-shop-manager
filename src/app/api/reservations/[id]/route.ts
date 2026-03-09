import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateCalendarEvent, deleteCalendarEvent } from "@/lib/google-calendar";

// GET /api/reservations/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      customer: true,
      vehicle: true,
    },
  });

  if (!reservation) {
    return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json(reservation);
}

// PUT /api/reservations/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const reservation = await prisma.reservation.update({
    where: { id },
    data: {
      customerId: body.customerId,
      vehicleId: body.vehicleId || null,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      duration: body.duration,
      serviceType: body.serviceType,
      description: body.description || null,
      status: body.status,
      memo: body.memo || null,
    },
    include: {
      customer: { select: { name: true, phone: true } },
      vehicle: { select: { carModel: true, plateNumber: true } },
    },
  });

  // Google Calendar 업데이트
  if (reservation.calendarEventId) {
    const vehicleInfo = reservation.vehicle
      ? `${reservation.vehicle.carModel}`
      : "";
    const summary = `[${reservation.serviceType}] ${reservation.customer.name}${vehicleInfo ? ` - ${vehicleInfo}` : ""}`;
    await updateCalendarEvent(reservation.calendarEventId, {
      summary,
      description: reservation.description || "",
      startTime: reservation.scheduledAt.toISOString(),
      duration: reservation.duration,
    });
  }

  return NextResponse.json(reservation);
}

// DELETE /api/reservations/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (reservation?.calendarEventId) {
    await deleteCalendarEvent(reservation.calendarEventId);
  }

  await prisma.reservation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
