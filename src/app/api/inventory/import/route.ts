import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseFile, extractInventoryItems } from "@/lib/excel-parser";

// POST /api/inventory/import - CSV/Excel 파일 임포트
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "파일이 필요합니다." },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["csv", "xlsx", "xls"].includes(ext)) {
      return NextResponse.json(
        { error: "CSV 또는 Excel 파일만 지원합니다." },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const result = parseFile(buffer, file.name);

    if (result.validRows === 0) {
      return NextResponse.json(
        { error: "유효한 데이터가 없습니다." },
        { status: 400 }
      );
    }

    // 재고 아이템 추출
    const inventoryItems = extractInventoryItems(result.rows);
    const errors: string[] = [];
    let successCount = 0;

    // 트랜잭션으로 일괄 처리
    await prisma.$transaction(async (tx) => {
      for (const item of inventoryItems) {
        try {
          // 이름으로 기존 아이템 검색
          const existing = await tx.inventoryItem.findFirst({
            where: { name: item.name },
          });

          if (existing) {
            // 기존 아이템이면 수량 업데이트 + 입고 로그
            await tx.inventoryItem.update({
              where: { id: existing.id },
              data: {
                quantity: existing.quantity + item.totalUsed,
              },
            });
            await tx.stockLog.create({
              data: {
                inventoryItemId: existing.id,
                type: "IN",
                quantity: item.totalUsed,
                reason: `엑셀 임포트 (${file.name})`,
              },
            });
          } else {
            // 새 아이템 생성
            const created = await tx.inventoryItem.create({
              data: {
                name: item.name,
                category: item.category,
                quantity: item.totalUsed,
                minQuantity: 5,
                unitPrice: 0,
              },
            });
            await tx.stockLog.create({
              data: {
                inventoryItemId: created.id,
                type: "IN",
                quantity: item.totalUsed,
                reason: `엑셀 임포트 (${file.name}) - 신규 등록`,
              },
            });
          }
          successCount++;
        } catch (err) {
          errors.push(`[${item.name}] 처리 실패: ${(err as Error).message}`);
        }
      }

      // 중복 감지용 캐시 (차량번호 → vehicleId, 연락처 → customerId)
      const vehicleCache = new Map<string, string>();
      const customerCache = new Map<string, string>();

      // 예약/서비스 데이터도 임포트
      for (const row of result.rows) {
        if (!row.contact && !row.plateNumber && !row.carModel) continue;

        try {
          // 고객 처리 (연락처 기준 중복 감지)
          let customerId: string | null = null;
          if (row.contact) {
            // 캐시 확인
            if (customerCache.has(row.contact)) {
              customerId = customerCache.get(row.contact)!;
            } else {
              const existingCustomer = await tx.customer.findFirst({
                where: { phone: row.contact },
              });
              if (existingCustomer) {
                customerId = existingCustomer.id;
              } else {
                const newCustomer = await tx.customer.create({
                  data: {
                    name: row.carModel || "미입력",
                    phone: row.contact,
                  },
                });
                customerId = newCustomer.id;
              }
              customerCache.set(row.contact, customerId);
            }
          }

          // 차량 처리 (차량번호 기준 중복 감지)
          let vehicleId: string | null = null;
          if (row.plateNumber && customerId) {
            if (vehicleCache.has(row.plateNumber)) {
              vehicleId = vehicleCache.get(row.plateNumber)!;
            } else {
              const existingVehicle = await tx.vehicle.findFirst({
                where: { plateNumber: row.plateNumber },
              });
              if (existingVehicle) {
                vehicleId = existingVehicle.id;
              } else {
                const newVehicle = await tx.vehicle.create({
                  data: {
                    customerId,
                    carModel: row.carModel || "미입력",
                    plateNumber: row.plateNumber,
                  },
                });
                vehicleId = newVehicle.id;
              }
              vehicleCache.set(row.plateNumber, vehicleId);
            }
          }

          // 예약 생성 (날짜가 있는 경우만)
          if (customerId && (row.reservationDate || row.startDate)) {
            const dateStr = row.startDate || row.reservationDate || "";
            let scheduledAt: Date;
            try {
              scheduledAt = new Date(dateStr);
              if (isNaN(scheduledAt.getTime())) {
                scheduledAt = new Date();
              }
            } catch {
              scheduledAt = new Date();
            }

            // 시간 설정
            if (row.startTime) {
              const timeParts = row.startTime.match(/(\d{1,2}):?(\d{2})?/);
              if (timeParts) {
                scheduledAt.setHours(
                  parseInt(timeParts[1]),
                  parseInt(timeParts[2] || "0")
                );
              }
            }

            // duration 계산
            let duration = 60;
            if (row.startTime && row.endTime) {
              const startParts = row.startTime.match(/(\d{1,2}):?(\d{2})?/);
              const endParts = row.endTime.match(/(\d{1,2}):?(\d{2})?/);
              if (startParts && endParts) {
                const startMin =
                  parseInt(startParts[1]) * 60 +
                  parseInt(startParts[2] || "0");
                const endMin =
                  parseInt(endParts[1]) * 60 +
                  parseInt(endParts[2] || "0");
                if (endMin > startMin) duration = endMin - startMin;
              }
            }

            await tx.reservation.create({
              data: {
                customerId,
                vehicleId,
                scheduledAt,
                duration,
                serviceType: row.serviceDescription || "일반정비",
                description: row.serviceDescription,
                status: row.status || "COMPLETED",
                memo: row.notes.join(" / ") || null,
              },
            });
          }

          successCount++;
        } catch (err) {
          errors.push(
            `[행 ${row.plateNumber || "?"}] 처리 실패: ${(err as Error).message}`
          );
        }
      }
    });

    // 임포트 이력 저장
    const importHistory = await prisma.importHistory.create({
      data: {
        fileName: file.name,
        fileType: ext,
        rowCount: result.validRows,
        successCount,
        errorCount: errors.length,
        status:
          errors.length === 0
            ? "SUCCESS"
            : successCount > 0
              ? "PARTIAL"
              : "FAILED",
        errors: errors.length > 0 ? JSON.stringify(errors) : null,
      },
    });

    return NextResponse.json({
      success: true,
      importId: importHistory.id,
      totalRows: result.validRows,
      successCount,
      errorCount: errors.length,
      errors: errors.slice(0, 10), // 최대 10개 에러만 반환
      inventoryItemsCreated: inventoryItems.length,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "임포트 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// GET /api/inventory/import - 임포트 이력 조회
export async function GET() {
  const history = await prisma.importHistory.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json(history);
}
