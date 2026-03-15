import * as XLSX from "xlsx";
import { z } from "zod";

// Zod 스키마: 파싱된 행 유효성 검증
const ParsedRowSchema = z.object({
  reservationDate: z.string().nullable(),
  status: z.string().nullable(),
  carModel: z.string().nullable(),
  plateNumber: z.string().nullable(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  contact: z.string().nullable(),
  amount: z.number().nullable(),
  serviceDescription: z.string().nullable(),
  notes: z.array(z.string()),
  items: z.array(
    z.object({
      name: z.string().min(1),
      quantity: z.number().positive(),
    })
  ),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
});

// 빅스모터스 CSV 헤더 키워드 매핑
const HEADER_KEYWORDS = [
  "예약일자",
  "상태",
  "소유",
  "차량",
  "차량 번호",
  "시작시간",
  "종료시간",
  "연락처",
  "금액",
  "수리",
  "비고",
  "항목",
  "사용량",
];

export interface ParsedRow {
  reservationDate: string | null;
  status: string | null;
  carModel: string | null;
  plateNumber: string | null;
  startTime: string | null;
  endTime: string | null;
  contact: string | null;
  amount: number | null;
  serviceDescription: string | null;
  notes: string[];
  items: { name: string; quantity: number }[];
  startDate: string | null;
  endDate: string | null;
}

export interface ParseResult {
  headers: string[];
  rows: ParsedRow[];
  rawRows: Record<string, string | number | null>[];
  totalRows: number;
  validRows: number;
  fileName: string;
}

/**
 * 빅스모터스 양식의 헤더 행을 감지합니다
 */
function findHeaderRow(sheet: XLSX.WorkSheet): number {
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
  for (let r = range.s.r; r <= Math.min(range.e.r, 10); r++) {
    let matchCount = 0;
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      if (cell && typeof cell.v === "string") {
        const val = cell.v.trim();
        if (HEADER_KEYWORDS.some((kw) => val.includes(kw))) {
          matchCount++;
        }
      }
    }
    if (matchCount >= 3) return r;
  }
  return 0; // 기본: 첫 행을 헤더로 사용
}

/**
 * 행이 비어있는지 확인 (FALSE만 있는 행 등)
 */
function isEmptyRow(row: Record<string, unknown>): boolean {
  const values = Object.values(row);
  if (values.length === 0) return true;
  const nonEmpty = values.filter((v) => {
    if (v === null || v === undefined || v === "") return false;
    if (typeof v === "string" && v.trim().toUpperCase() === "FALSE") return false;
    if (typeof v === "boolean" && !v) return false;
    return true;
  });
  return nonEmpty.length === 0;
}

/**
 * 헤더명으로 컬럼 인덱스를 찾습니다
 */
function findColumnIndex(
  headers: string[],
  ...keywords: string[]
): number {
  return headers.findIndex((h) => {
    const normalized = (h || "").trim();
    return keywords.some((kw) => normalized.includes(kw));
  });
}

/**
 * CSV/Excel 파일 버퍼를 파싱합니다
 */
export function parseFile(
  buffer: ArrayBuffer,
  fileName: string
): ParseResult {
  const workbook = XLSX.read(buffer, { type: "array", codepage: 65001 });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // 헤더 행 감지
  const headerRowIdx = findHeaderRow(sheet);

  // 전체 데이터를 JSON으로 변환 (헤더 행 기준)
  const allData: Record<string, string | number | null>[] =
    XLSX.utils.sheet_to_json(sheet, {
      header: "A",
      range: headerRowIdx,
      defval: null,
    });

  if (allData.length === 0) {
    return {
      headers: [],
      rows: [],
      rawRows: [],
      totalRows: 0,
      validRows: 0,
      fileName,
    };
  }

  // 첫 행을 헤더로 사용
  const headerRow = allData[0];
  const headers = Object.values(headerRow).map((v) =>
    v !== null && v !== undefined ? String(v).trim() : ""
  );
  const headerKeys = Object.keys(headerRow);

  // 데이터 행 추출 (헤더 제외, 빈 행 제외)
  const dataRows = allData.slice(1).filter((row) => !isEmptyRow(row));

  // 컬럼 인덱스 매핑
  const colMap = {
    reservationDate: findColumnIndex(headers, "예약일자", "예약일"),
    status: findColumnIndex(headers, "상태"),
    carModel: findColumnIndex(headers, "소유", "차량", "소유 차량"),
    plateNumber: findColumnIndex(headers, "차량 번호", "번호"),
    startTime: findColumnIndex(headers, "시작시간", "시작"),
    endTime: findColumnIndex(headers, "종료시간", "종료"),
    contact: findColumnIndex(headers, "연락처", "연락"),
    amount: findColumnIndex(headers, "금액"),
    serviceDescription: findColumnIndex(headers, "수리", "내용", "수리 내용"),
  };

  // 비고 컬럼들
  const noteIndices: number[] = [];
  headers.forEach((h, i) => {
    if (h.includes("비고")) noteIndices.push(i);
  });

  // 항목 + 사용량 컬럼 쌍
  const itemPairs: { nameIdx: number; qtyIdx: number }[] = [];
  headers.forEach((h, i) => {
    if (h.includes("항목") && !h.includes("사용량")) {
      // 다음 컬럼이 사용량인지 확인
      const nextIdx = i + 1;
      if (nextIdx < headers.length && headers[nextIdx].includes("사용량")) {
        itemPairs.push({ nameIdx: i, qtyIdx: nextIdx });
      }
    }
  });

  // startDate, endDate 컬럼
  const startDateIdx = findColumnIndex(headers, "startDate");
  const endDateIdx = findColumnIndex(headers, "endDate");

  // 파싱된 행 생성
  const parsedRows: ParsedRow[] = dataRows.map((row) => {
    const getVal = (idx: number): string | null => {
      if (idx < 0) return null;
      const key = headerKeys[idx];
      const val = row[key];
      if (val === null || val === undefined) return null;
      const str = String(val).trim();
      return str === "" || str.toUpperCase() === "FALSE" ? null : str;
    };

    const getNum = (idx: number): number | null => {
      const val = getVal(idx);
      if (!val) return null;
      const num = Number(val.replace(/[,원]/g, ""));
      return isNaN(num) ? null : num;
    };

    const notes = noteIndices.map((i) => getVal(i)).filter(Boolean) as string[];
    const items = itemPairs
      .map((pair) => {
        const name = getVal(pair.nameIdx);
        const qty = getNum(pair.qtyIdx);
        if (name && qty && qty > 0) return { name, quantity: qty };
        return null;
      })
      .filter(Boolean) as { name: string; quantity: number }[];

    return {
      reservationDate: getVal(colMap.reservationDate),
      status: getVal(colMap.status),
      carModel: getVal(colMap.carModel),
      plateNumber: getVal(colMap.plateNumber),
      startTime: getVal(colMap.startTime),
      endTime: getVal(colMap.endTime),
      contact: getVal(colMap.contact),
      amount: getNum(colMap.amount),
      serviceDescription: getVal(colMap.serviceDescription),
      notes,
      items,
      startDate: getVal(startDateIdx),
      endDate: getVal(endDateIdx),
    };
  });

  // Zod 유효성 검증: 유효하지 않은 행 필터링
  const validatedRows = parsedRows.filter((row) => {
    const result = ParsedRowSchema.safeParse(row);
    return result.success;
  });

  // rawRows - 원본 데이터를 키-값으로 변환
  const rawRows = dataRows.map((row) => {
    const mapped: Record<string, string | number | null> = {};
    headerKeys.forEach((key, i) => {
      const header = headers[i] || key;
      mapped[header] = row[key] as string | number | null;
    });
    return mapped;
  });

  return {
    headers: headers.filter((h) => h !== ""),
    rows: validatedRows,
    rawRows,
    totalRows: allData.length - 1,
    validRows: validatedRows.length,
    fileName,
  };
}

/**
 * 파싱된 행에서 재고 아이템 데이터를 추출합니다
 */
export function extractInventoryItems(
  rows: ParsedRow[]
): {
  name: string;
  category: string;
  totalUsed: number;
  occurrences: number;
}[] {
  const itemMap = new Map<
    string,
    { category: string; totalUsed: number; occurrences: number }
  >();

  for (const row of rows) {
    for (const item of row.items) {
      const existing = itemMap.get(item.name);
      if (existing) {
        existing.totalUsed += item.quantity;
        existing.occurrences++;
      } else {
        itemMap.set(item.name, {
          category: guessCategory(item.name),
          totalUsed: item.quantity,
          occurrences: 1,
        });
      }
    }
  }

  return Array.from(itemMap.entries()).map(([name, data]) => ({
    name,
    ...data,
  }));
}

/**
 * 아이템 이름으로 카테고리를 추정합니다
 */
function guessCategory(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("오일") || lower.includes("oil")) return "엔진오일";
  if (lower.includes("브레이크") || lower.includes("brake")) return "브레이크";
  if (lower.includes("타이어") || lower.includes("tire")) return "타이어";
  if (lower.includes("필터") || lower.includes("filter")) return "필터";
  if (lower.includes("배터리") || lower.includes("battery")) return "배터리";
  if (lower.includes("냉각") || lower.includes("coolant")) return "냉각수";
  if (lower.includes("미션")) return "미션오일";
  if (lower.includes("점화") || lower.includes("spark")) return "점화플러그";
  if (lower.includes("벨트") || lower.includes("belt")) return "벨트";
  return "기타";
}
