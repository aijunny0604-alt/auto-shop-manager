# Google Sheets Sync Design Document

> **Summary**: DB → Google Sheets 단방향 동기화 구현 설계
>
> **Project**: auto-shop-manager
> **Date**: 2026-03-13
> **Plan Reference**: `docs/01-plan/features/google-sheets-sync.plan.md`

---

## 1. System Architecture

### 1.1 데이터 흐름

```
[앱 CRUD 작업]
     │
     ▼
[Prisma DB (SQLite)] ── 원본 데이터 (동기)
     │
     ▼ (비동기, fire-and-forget)
[google-sheets.ts] ── Google Sheets API v4
     │
     ▼
[Google Spreadsheet] ── 뷰/관리용 (읽기 전용)
```

### 1.2 파일 구조

```
src/
├── lib/
│   ├── google-calendar.ts     # 기존 Calendar API
│   └── google-sheets.ts       # [NEW] Sheets API 클라이언트
├── app/api/
│   ├── sheets/
│   │   ├── sync/route.ts      # [NEW] 수동 전체 동기화
│   │   └── status/route.ts    # [NEW] 연결 상태 확인
│   ├── customers/route.ts     # [MODIFY] POST에 시트 동기화 추가
│   └── reservations/route.ts  # [MODIFY] POST/PUT/DELETE에 시트 동기화 추가
```

---

## 2. Component Design

### 2.1 google-sheets.ts - Core Module

```typescript
// OAuth: 기존 google-calendar.ts의 oauth2Client 공유
// 스코프: calendar + spreadsheets 통합

// 핵심 함수
export function isSheetConnected(): boolean
export async function ensureSheets(): Promise<void>  // 시트/헤더 자동 생성
export async function syncCustomerToSheet(customer: CustomerRow): Promise<void>
export async function syncReservationToSheet(reservation: ReservationRow): Promise<void>
export async function updateReservationInSheet(id: string, data: ReservationRow): Promise<void>
export async function deleteReservationFromSheet(id: string): Promise<void>
export async function fullSync(): Promise<{ customers: number; reservations: number }>
```

### 2.2 시트 구조

**"고객" 시트 (Sheet: 고객목록)**

| A (ID) | B (이름) | C (전화번호) | D (메모) | E (등록일) | F (차량수) | G (예약수) |
|--------|---------|------------|---------|----------|----------|----------|
| cuid | 홍길동 | 010-1234-5678 | VIP | 2026-03-13 | 2 | 5 |

**"예약" 시트 (Sheet: 예약목록)**

| A (ID) | B (고객명) | C (전화번호) | D (차량) | E (예약일시) | F (작업유형) | G (소요시간) | H (상태) | I (작업내용) | J (메모) |
|--------|----------|------------|---------|-----------|-----------|-----------|---------|-----------|---------|
| cuid | 홍길동 | 010-1234-5678 | 아반떼 | 2026-03-14 16:00 | 정비 | 60분 | 대기 | 엔진오일 교환 | - |

### 2.3 OAuth 스코프 통합

```typescript
// google-calendar.ts 수정
export function getAuthUrl(): string {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/spreadsheets",  // 추가
    ],
    prompt: "consent",
  });
}
```

---

## 3. API Design

### 3.1 GET /api/sheets/status

**Response:**
```json
{ "connected": true, "sheetId": "abc123", "sheetUrl": "https://docs.google.com/spreadsheets/d/abc123" }
```

### 3.2 POST /api/sheets/sync

**Description:** 전체 고객 + 예약 데이터를 시트에 일괄 동기화

**Response:**
```json
{ "success": true, "synced": { "customers": 45, "reservations": 120 } }
```

---

## 4. Integration Points

### 4.1 기존 API 수정 사항

**POST /api/customers (고객 생성)**
```
DB 저장 → 성공 → syncCustomerToSheet(customer) [비동기]
```

**POST /api/reservations (예약 생성)**
```
DB 저장 → Calendar 이벤트 → syncReservationToSheet(reservation) [비동기]
```

**PUT /api/reservations/[id] (예약 수정)**
```
DB 업데이트 → Calendar 업데이트 → updateReservationInSheet(id, reservation) [비동기]
```

**DELETE /api/reservations/[id] (예약 삭제)**
```
Calendar 삭제 → DB 삭제 → deleteReservationFromSheet(id) [비동기]
```

### 4.2 비동기 처리 패턴

```typescript
// 모든 시트 동기화는 fire-and-forget
// 실패해도 API 응답에 영향 없음
syncCustomerToSheet(customer).catch((err) =>
  console.error("Sheets sync failed:", err)
);
```

---

## 5. Environment Variables

```env
# .env.local에 추가
GOOGLE_SHEET_ID="구글_시트_ID_여기에_입력"
```

**시트 ID 확인 방법:**
Google Sheets URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`

---

## 6. Implementation Order

1. **google-calendar.ts**: OAuth 스코프에 spreadsheets 추가
2. **google-sheets.ts**: 핵심 모듈 구현 (CRUD + ensureSheets)
3. **.env.local**: GOOGLE_SHEET_ID 변수 추가
4. **api/sheets/status/route.ts**: 연결 상태 API
5. **api/sheets/sync/route.ts**: 수동 전체 동기화 API
6. **api/customers/route.ts**: POST에 시트 동기화 추가
7. **api/reservations/route.ts**: POST에 시트 동기화 추가
8. **api/reservations/[id]/route.ts**: PUT/DELETE에 시트 동기화 추가

---

## 7. Error Handling

| 상황 | 처리 |
|------|------|
| Google Sheets API 미연결 | 동기화 skip, 로그만 출력 |
| GOOGLE_SHEET_ID 미설정 | 동기화 skip |
| 시트 미존재 | ensureSheets()로 자동 생성 |
| API 속도 제한 (429) | 로그 기록, 다음 요청 시 재시도 |
| 행 찾기 실패 (update/delete) | 로그 기록, 무시 |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-03-13 | Initial design |
