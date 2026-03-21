import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface BackupData {
  exportedAt: string;
  version: string;
  data: {
    customers: Record<string, unknown>[];
    vehicles: Record<string, unknown>[];
    serviceRecords: Record<string, unknown>[];
    servicePartUsed: Record<string, unknown>[];
    inventoryItems: Record<string, unknown>[];
    stockLogs: Record<string, unknown>[];
    reservations: Record<string, unknown>[];
    estimates: Record<string, unknown>[];
    estimateItems: Record<string, unknown>[];
    importHistories: Record<string, unknown>[];
  };
}

// POST /api/backup/import
export async function POST(request: NextRequest) {
  try {
    const backup: BackupData = await request.json();

    // 기본 유효성 검사
    if (!backup.version || !backup.data) {
      return NextResponse.json(
        { error: "유효하지 않은 백업 파일입니다." },
        { status: 400 }
      );
    }

    const { data } = backup;

    await prisma.$transaction(async (tx) => {
      // ── 1. 자식 테이블부터 삭제 (FK 의존 순서) ──
      await tx.servicePartUsed.deleteMany();
      await tx.estimateItem.deleteMany();
      await tx.stockLog.deleteMany();
      await tx.serviceRecord.deleteMany();
      await tx.reservation.deleteMany();
      await tx.estimate.deleteMany();
      await tx.vehicle.deleteMany();
      await tx.customer.deleteMany();
      await tx.inventoryItem.deleteMany();
      await tx.importHistory.deleteMany();

      // ── 2. 부모 테이블부터 삽입 ──

      // Customer
      if (data.customers?.length) {
        await tx.customer.createMany({
          data: data.customers.map((c) => ({
            id: c.id as string,
            name: c.name as string,
            phone: (c.phone as string) || null,
            memo: (c.memo as string) || null,
            createdAt: new Date(c.createdAt as string),
            updatedAt: new Date(c.updatedAt as string),
          })),
        });
      }

      // Vehicle
      if (data.vehicles?.length) {
        await tx.vehicle.createMany({
          data: data.vehicles.map((v) => ({
            id: v.id as string,
            customerId: v.customerId as string,
            carModel: v.carModel as string,
            year: (v.year as number) || null,
            plateNumber: (v.plateNumber as string) || null,
            mileage: (v.mileage as number) || null,
            memo: (v.memo as string) || null,
            createdAt: new Date(v.createdAt as string),
            updatedAt: new Date(v.updatedAt as string),
          })),
        });
      }

      // InventoryItem
      if (data.inventoryItems?.length) {
        await tx.inventoryItem.createMany({
          data: data.inventoryItems.map((i) => ({
            id: i.id as string,
            name: i.name as string,
            category: i.category as string,
            quantity: (i.quantity as number) ?? 0,
            minQuantity: (i.minQuantity as number) ?? 5,
            unitPrice: (i.unitPrice as number) ?? 0,
            location: (i.location as string) || null,
            memo: (i.memo as string) || null,
            createdAt: new Date(i.createdAt as string),
            updatedAt: new Date(i.updatedAt as string),
          })),
        });
      }

      // ServiceRecord
      if (data.serviceRecords?.length) {
        await tx.serviceRecord.createMany({
          data: data.serviceRecords.map((s) => ({
            id: s.id as string,
            vehicleId: s.vehicleId as string,
            serviceDate: new Date(s.serviceDate as string),
            serviceType: s.serviceType as string,
            description: s.description as string,
            cost: (s.cost as number) ?? 0,
            memo: (s.memo as string) || null,
            createdAt: new Date(s.createdAt as string),
            updatedAt: new Date(s.updatedAt as string),
          })),
        });
      }

      // ServicePartUsed
      if (data.servicePartUsed?.length) {
        await tx.servicePartUsed.createMany({
          data: data.servicePartUsed.map((sp) => ({
            id: sp.id as string,
            serviceRecordId: sp.serviceRecordId as string,
            inventoryItemId: sp.inventoryItemId as string,
            quantity: sp.quantity as number,
          })),
        });
      }

      // StockLog
      if (data.stockLogs?.length) {
        await tx.stockLog.createMany({
          data: data.stockLogs.map((sl) => ({
            id: sl.id as string,
            inventoryItemId: sl.inventoryItemId as string,
            type: sl.type as string,
            quantity: sl.quantity as number,
            reason: (sl.reason as string) || null,
            createdAt: new Date(sl.createdAt as string),
          })),
        });
      }

      // Reservation
      if (data.reservations?.length) {
        await tx.reservation.createMany({
          data: data.reservations.map((r) => ({
            id: r.id as string,
            customerId: r.customerId as string,
            vehicleId: (r.vehicleId as string) || null,
            scheduledAt: new Date(r.scheduledAt as string),
            duration: (r.duration as number) ?? 60,
            serviceType: r.serviceType as string,
            description: (r.description as string) || null,
            status: (r.status as string) ?? "PENDING",
            calendarEventId: (r.calendarEventId as string) || null,
            memo: (r.memo as string) || null,
            createdAt: new Date(r.createdAt as string),
            updatedAt: new Date(r.updatedAt as string),
          })),
        });
      }

      // Estimate
      if (data.estimates?.length) {
        await tx.estimate.createMany({
          data: data.estimates.map((e) => ({
            id: e.id as string,
            estimateNo: e.estimateNo as string,
            customerId: e.customerId as string,
            vehicleId: (e.vehicleId as string) || null,
            status: (e.status as string) ?? "DRAFT",
            validUntil: e.validUntil ? new Date(e.validUntil as string) : null,
            totalAmount: (e.totalAmount as number) ?? 0,
            discount: (e.discount as number) ?? 0,
            memo: (e.memo as string) || null,
            createdAt: new Date(e.createdAt as string),
            updatedAt: new Date(e.updatedAt as string),
          })),
        });
      }

      // EstimateItem
      if (data.estimateItems?.length) {
        await tx.estimateItem.createMany({
          data: data.estimateItems.map((ei) => ({
            id: ei.id as string,
            estimateId: ei.estimateId as string,
            type: ei.type as string,
            name: ei.name as string,
            inventoryItemId: (ei.inventoryItemId as string) || null,
            quantity: (ei.quantity as number) ?? 1,
            unitPrice: (ei.unitPrice as number) ?? 0,
            amount: (ei.amount as number) ?? 0,
            memo: (ei.memo as string) || null,
            sortOrder: (ei.sortOrder as number) ?? 0,
          })),
        });
      }

      // ImportHistory
      if (data.importHistories?.length) {
        await tx.importHistory.createMany({
          data: data.importHistories.map((ih) => ({
            id: ih.id as string,
            fileName: ih.fileName as string,
            fileType: ih.fileType as string,
            rowCount: ih.rowCount as number,
            successCount: ih.successCount as number,
            errorCount: ih.errorCount as number,
            status: ih.status as string,
            errors: (ih.errors as string) || null,
            createdAt: new Date(ih.createdAt as string),
          })),
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "데이터가 성공적으로 복원되었습니다.",
      counts: {
        customers: data.customers?.length ?? 0,
        vehicles: data.vehicles?.length ?? 0,
        serviceRecords: data.serviceRecords?.length ?? 0,
        servicePartUsed: data.servicePartUsed?.length ?? 0,
        inventoryItems: data.inventoryItems?.length ?? 0,
        stockLogs: data.stockLogs?.length ?? 0,
        reservations: data.reservations?.length ?? 0,
        estimates: data.estimates?.length ?? 0,
        estimateItems: data.estimateItems?.length ?? 0,
        importHistories: data.importHistories?.length ?? 0,
      },
    });
  } catch (error) {
    console.error("Backup import failed:", error);
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    return NextResponse.json(
      { error: `복원에 실패했습니다: ${message}` },
      { status: 500 }
    );
  }
}
