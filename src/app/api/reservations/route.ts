import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCalendarEvent } from "@/lib/google-calendar";
import { syncReservationToSheet } from "@/lib/google-sheets";

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
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const { customerId, customerName, customerPhone, vehicleId, newVehicle, scheduledAt, duration, serviceType, description, memo } = body;

  if ((!customerId && !customerName) || !scheduledAt || !serviceType) {
    return NextResponse.json(
      { error: "고객, 예약일시, 작업 유형은 필수입니다." },
      { status: 400 }
    );
  }

  // 날짜 유효성 검증
  const scheduledDate = new Date(scheduledAt);
  if (isNaN(scheduledDate.getTime())) {
    return NextResponse.json({ error: "유효하지 않은 날짜 형식입니다." }, { status: 400 });
  }

  try {
    // 트랜잭션으로 고객 생성 + 차량 생성 + 예약 생성 원자성 보장
    const reservation = await prisma.$transaction(async (tx) => {
      let resolvedCustomerId = customerId;

      if (!customerId && customerName) {
        const newCustomer = await tx.customer.create({
          data: { name: customerName, phone: customerPhone || null },
        });
        resolvedCustomerId = newCustomer.id;
      }

      // 새 차량 등록
      let resolvedVehicleId = vehicleId || null;
      if (newVehicle && newVehicle.carModel) {
        const createdVehicle = await tx.vehicle.create({
          data: {
            customerId: resolvedCustomerId,
            carModel: newVehicle.carModel,
            year: newVehicle.year || null,
            plateNumber: newVehicle.plateNumber || null,
            mileage: newVehicle.mileage || null,
          },
        });
        resolvedVehicleId = createdVehicle.id;
      }

      return tx.reservation.create({
        data: {
          customerId: resolvedCustomerId,
          vehicleId: resolvedVehicleId,
          scheduledAt: scheduledDate,
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
    });

    // Google Calendar 이벤트 생성 시도 (트랜잭션 외부 - 실패해도 예약은 유지)
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

    // Google Sheets 동기화 (비동기, 실패해도 무시)
    syncReservationToSheet(reservation).catch((err) =>
      console.error("Sheets reservation sync failed:", err)
    );

    return NextResponse.json(reservation, { status: 201 });
  } catch (err) {
    console.error("예약 등록 실패:", err);
    return NextResponse.json({ error: "예약 등록에 실패했습니다." }, { status: 500 });
  }
}
