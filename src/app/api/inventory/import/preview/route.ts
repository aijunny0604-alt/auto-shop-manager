import { NextRequest, NextResponse } from "next/server";
import { parseFile, extractInventoryItems } from "@/lib/excel-parser";

// POST /api/inventory/import/preview - 파일 미리보기
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

    // 파일 확장자 검증
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["csv", "xlsx", "xls"].includes(ext)) {
      return NextResponse.json(
        { error: "CSV 또는 Excel 파일만 지원합니다. (.csv, .xlsx, .xls)" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const result = parseFile(buffer, file.name);

    // 재고 아이템 추출
    const inventoryItems = extractInventoryItems(result.rows);

    return NextResponse.json({
      fileName: result.fileName,
      headers: result.headers,
      totalRows: result.totalRows,
      validRows: result.validRows,
      previewRows: result.rawRows.slice(0, 20), // 미리보기는 최대 20행
      parsedRows: result.rows.slice(0, 20),
      inventoryItems,
    });
  } catch (error) {
    console.error("Preview error:", error);
    return NextResponse.json(
      { error: "파일 파싱 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
