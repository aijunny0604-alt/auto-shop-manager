import { google } from "googleapis";
import { oauth2Client, loadToken } from "./google-calendar";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const CUSTOMER_SHEET = "고객목록";
const RESERVATION_SHEET = "예약목록";

function getSheets() {
  loadToken();
  return google.sheets({ version: "v4", auth: oauth2Client });
}

/** Sheets 연결 가능 여부 */
export function isSheetConnected(): boolean {
  return !!(SHEET_ID && loadToken());
}

/** 시트 존재 확인 + 없으면 자동 생성 */
export async function ensureSheets(): Promise<void> {
  if (!isSheetConnected()) return;

  const sheets = getSheets();
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID!,
  });

  const existing = spreadsheet.data.sheets?.map((s) => s.properties?.title) || [];

  const toCreate: { title: string; headers: string[] }[] = [];

  if (!existing.includes(CUSTOMER_SHEET)) {
    toCreate.push({
      title: CUSTOMER_SHEET,
      headers: ["ID", "이름", "전화번호", "메모", "등록일", "차량수", "예약수"],
    });
  }

  if (!existing.includes(RESERVATION_SHEET)) {
    toCreate.push({
      title: RESERVATION_SHEET,
      headers: ["ID", "고객명", "전화번호", "차량", "예약일시", "작업유형", "소요시간", "상태", "작업내용", "메모"],
    });
  }

  for (const sheet of toCreate) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID!,
      requestBody: {
        requests: [{ addSheet: { properties: { title: sheet.title } } }],
      },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID!,
      range: `${sheet.title}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [sheet.headers] },
    });
  }
}

/** 고객 → 시트 동기화 */
export async function syncCustomerToSheet(customer: {
  id: string;
  name: string;
  phone: string | null;
  memo: string | null;
  createdAt: string | Date;
  _count?: { vehicles: number; reservations: number };
}): Promise<void> {
  if (!isSheetConnected()) return;

  const sheets = getSheets();
  const createdAt = customer.createdAt instanceof Date
    ? customer.createdAt.toISOString().split("T")[0]
    : new Date(customer.createdAt).toISOString().split("T")[0];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID!,
    range: `${CUSTOMER_SHEET}!A:G`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        customer.id,
        customer.name,
        customer.phone || "",
        customer.memo || "",
        createdAt,
        customer._count?.vehicles ?? 0,
        customer._count?.reservations ?? 0,
      ]],
    },
  });
}

/** 예약 → 시트 동기화 */
export async function syncReservationToSheet(reservation: {
  id: string;
  scheduledAt: string | Date;
  serviceType: string;
  duration: number;
  status: string;
  description: string | null;
  memo: string | null;
  customer?: { name: string; phone: string | null };
  vehicle?: { carModel: string; plateNumber: string | null } | null;
}): Promise<void> {
  if (!isSheetConnected()) return;

  const sheets = getSheets();
  const scheduledAt = reservation.scheduledAt instanceof Date
    ? reservation.scheduledAt.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })
    : new Date(reservation.scheduledAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  const vehicleInfo = reservation.vehicle
    ? `${reservation.vehicle.carModel}${reservation.vehicle.plateNumber ? ` (${reservation.vehicle.plateNumber})` : ""}`
    : "";

  const statusMap: Record<string, string> = {
    PENDING: "대기",
    CONFIRMED: "확정",
    COMPLETED: "완료",
    CANCELLED: "취소",
  };

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID!,
    range: `${RESERVATION_SHEET}!A:J`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        reservation.id,
        reservation.customer?.name || "",
        reservation.customer?.phone || "",
        vehicleInfo,
        scheduledAt,
        reservation.serviceType,
        `${reservation.duration}분`,
        statusMap[reservation.status] || reservation.status,
        reservation.description || "",
        reservation.memo || "",
      ]],
    },
  });
}

/** 시트에서 행 찾기 (ID 기준) */
async function findRowByIdInSheet(
  sheetName: string,
  id: string
): Promise<number | null> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID!,
    range: `${sheetName}!A:A`,
  });

  const rows = res.data.values || [];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === id) return i + 1; // 1-based row number
  }
  return null;
}

/** 예약 시트 행 업데이트 */
export async function updateReservationInSheet(
  id: string,
  reservation: {
    scheduledAt: string | Date;
    serviceType: string;
    duration: number;
    status: string;
    description: string | null;
    memo: string | null;
    customer?: { name: string; phone: string | null };
    vehicle?: { carModel: string; plateNumber: string | null } | null;
  }
): Promise<void> {
  if (!isSheetConnected()) return;

  const rowNum = await findRowByIdInSheet(RESERVATION_SHEET, id);
  if (!rowNum) return;

  const sheets = getSheets();
  const scheduledAt = reservation.scheduledAt instanceof Date
    ? reservation.scheduledAt.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })
    : new Date(reservation.scheduledAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  const vehicleInfo = reservation.vehicle
    ? `${reservation.vehicle.carModel}${reservation.vehicle.plateNumber ? ` (${reservation.vehicle.plateNumber})` : ""}`
    : "";

  const statusMap: Record<string, string> = {
    PENDING: "대기", CONFIRMED: "확정", COMPLETED: "완료", CANCELLED: "취소",
  };

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID!,
    range: `${RESERVATION_SHEET}!A${rowNum}:J${rowNum}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        id,
        reservation.customer?.name || "",
        reservation.customer?.phone || "",
        vehicleInfo,
        scheduledAt,
        reservation.serviceType,
        `${reservation.duration}분`,
        statusMap[reservation.status] || reservation.status,
        reservation.description || "",
        reservation.memo || "",
      ]],
    },
  });
}

/** 예약 시트에서 행 삭제 */
export async function deleteReservationFromSheet(id: string): Promise<void> {
  if (!isSheetConnected()) return;

  const rowNum = await findRowByIdInSheet(RESERVATION_SHEET, id);
  if (!rowNum) return;

  const sheets = getSheets();

  // 시트 ID 조회
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID!,
  });
  const sheetMeta = spreadsheet.data.sheets?.find(
    (s) => s.properties?.title === RESERVATION_SHEET
  );
  if (!sheetMeta?.properties?.sheetId && sheetMeta?.properties?.sheetId !== 0) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID!,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: sheetMeta.properties.sheetId,
            dimension: "ROWS",
            startIndex: rowNum - 1,
            endIndex: rowNum,
          },
        },
      }],
    },
  });
}

/** 전체 데이터 동기화 */
export async function fullSync(
  customers: Array<{
    id: string; name: string; phone: string | null; memo: string | null;
    createdAt: string | Date;
    _count?: { vehicles: number; reservations: number };
  }>,
  reservations: Array<{
    id: string; scheduledAt: string | Date; serviceType: string;
    duration: number; status: string; description: string | null;
    memo: string | null;
    customer?: { name: string; phone: string | null };
    vehicle?: { carModel: string; plateNumber: string | null } | null;
  }>
): Promise<{ customers: number; reservations: number }> {
  if (!isSheetConnected()) {
    return { customers: 0, reservations: 0 };
  }

  await ensureSheets();
  const sheets = getSheets();

  // 고객 시트 초기화 + 데이터 쓰기
  const customerHeaders = ["ID", "이름", "전화번호", "메모", "등록일", "차량수", "예약수"];
  const customerRows = customers.map((c) => {
    const createdAt = c.createdAt instanceof Date
      ? c.createdAt.toISOString().split("T")[0]
      : new Date(c.createdAt).toISOString().split("T")[0];
    return [c.id, c.name, c.phone || "", c.memo || "", createdAt, c._count?.vehicles ?? 0, c._count?.reservations ?? 0];
  });

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID!,
    range: `${CUSTOMER_SHEET}!A:G`,
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID!,
    range: `${CUSTOMER_SHEET}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [customerHeaders, ...customerRows] },
  });

  // 예약 시트 초기화 + 데이터 쓰기
  const reservationHeaders = ["ID", "고객명", "전화번호", "차량", "예약일시", "작업유형", "소요시간", "상태", "작업내용", "메모"];
  const statusMap: Record<string, string> = {
    PENDING: "대기", CONFIRMED: "확정", COMPLETED: "완료", CANCELLED: "취소",
  };
  const reservationRows = reservations.map((r) => {
    const scheduledAt = r.scheduledAt instanceof Date
      ? r.scheduledAt.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })
      : new Date(r.scheduledAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
    const vehicleInfo = r.vehicle
      ? `${r.vehicle.carModel}${r.vehicle.plateNumber ? ` (${r.vehicle.plateNumber})` : ""}`
      : "";
    return [r.id, r.customer?.name || "", r.customer?.phone || "", vehicleInfo, scheduledAt, r.serviceType, `${r.duration}분`, statusMap[r.status] || r.status, r.description || "", r.memo || ""];
  });

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID!,
    range: `${RESERVATION_SHEET}!A:J`,
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID!,
    range: `${RESERVATION_SHEET}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [reservationHeaders, ...reservationRows] },
  });

  return { customers: customers.length, reservations: reservations.length };
}
