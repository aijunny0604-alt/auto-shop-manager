import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

// GET /api/inventory/export - Excel 다운로드
export async function GET() {
  try {
    // 재고 데이터 조회
    const items = await prisma.inventoryItem.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        stockLogs: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    // 예약 데이터 조회
    const reservations = await prisma.reservation.findMany({
      orderBy: { scheduledAt: "desc" },
      include: {
        customer: true,
        vehicle: true,
      },
    });

    // 워크북 생성
    const workbook = XLSX.utils.book_new();

    // --- 재고 목록 시트 ---
    const inventoryData = items.map((item) => ({
      부품명: item.name,
      카테고리: item.category,
      현재수량: item.quantity,
      최소수량: item.minQuantity,
      단가: item.unitPrice,
      위치: item.location || "",
      메모: item.memo || "",
      상태: item.quantity <= item.minQuantity ? "부족" : "정상",
      등록일: new Date(item.createdAt).toLocaleDateString("ko-KR"),
      수정일: new Date(item.updatedAt).toLocaleDateString("ko-KR"),
    }));

    const inventorySheet = XLSX.utils.json_to_sheet(inventoryData);

    // 컬럼 너비 설정
    inventorySheet["!cols"] = [
      { wch: 20 }, // 부품명
      { wch: 12 }, // 카테고리
      { wch: 10 }, // 현재수량
      { wch: 10 }, // 최소수량
      { wch: 12 }, // 단가
      { wch: 15 }, // 위치
      { wch: 20 }, // 메모
      { wch: 8 },  // 상태
      { wch: 12 }, // 등록일
      { wch: 12 }, // 수정일
    ];

    XLSX.utils.book_append_sheet(workbook, inventorySheet, "재고목록");

    // --- 입출고 이력 시트 ---
    const stockLogData = items.flatMap((item) =>
      item.stockLogs.map((log) => ({
        부품명: item.name,
        카테고리: item.category,
        구분: log.type === "IN" ? "입고" : "출고",
        수량: log.quantity,
        사유: log.reason || "",
        일시: new Date(log.createdAt).toLocaleString("ko-KR"),
      }))
    );

    if (stockLogData.length > 0) {
      const stockLogSheet = XLSX.utils.json_to_sheet(stockLogData);
      stockLogSheet["!cols"] = [
        { wch: 20 },
        { wch: 12 },
        { wch: 8 },
        { wch: 10 },
        { wch: 25 },
        { wch: 20 },
      ];
      XLSX.utils.book_append_sheet(workbook, stockLogSheet, "입출고이력");
    }

    // --- 예약/서비스 이력 시트 (빅스모터스 양식 호환) ---
    const reservationData = reservations.map((r) => ({
      예약일자: new Date(r.scheduledAt).toLocaleDateString("ko-KR"),
      상태: r.status,
      "소유 차량": r.vehicle?.carModel || "",
      "차량 번호": r.vehicle?.plateNumber || "",
      시작시간: new Date(r.scheduledAt).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      종료시간: new Date(
        new Date(r.scheduledAt).getTime() + r.duration * 60000
      ).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      연락처: r.customer?.phone || "",
      금액: 0,
      "수리 내용": r.description || r.serviceType || "",
      비고1: r.memo || "",
      startDate: new Date(r.scheduledAt).toISOString().split("T")[0],
      endDate: new Date(
        new Date(r.scheduledAt).getTime() + r.duration * 60000
      )
        .toISOString()
        .split("T")[0],
    }));

    const reservationSheet = XLSX.utils.json_to_sheet(reservationData);
    reservationSheet["!cols"] = [
      { wch: 12 },
      { wch: 10 },
      { wch: 15 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
      { wch: 10 },
      { wch: 25 },
      { wch: 20 },
      { wch: 12 },
      { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(workbook, reservationSheet, "예약관리");

    // Excel 파일 생성
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    const today = new Date().toISOString().split("T")[0];
    const filename = `빅스모터스_재고백업_${today}.xlsx`;

    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "엑셀 다운로드 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
