# Auto Shop Manager 설계 문서

> **Summary**: 자동차 정비 & 튜닝샵을 위한 재고/고객/예약 관리 웹 애플리케이션 상세 설계
>
> **Project**: auto-shop-manager
> **Author**: ROSSA
> **Date**: 2026-03-09
> **Status**: Draft
> **Planning Doc**: [auto-shop-manager.plan.md](../../01-plan/features/auto-shop-manager.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- 정비샵 운영에 필요한 3대 기능(재고/고객/예약)을 하나의 웹 앱에서 통합 관리
- Google Calendar API v3 양방향 연동으로 모바일에서도 일정 확인 가능
- 1인 사용 최적화: 인증 없이 심플하게 구성

### 1.2 Design Principles

- **Simple First**: 1인 사용에 불필요한 복잡도 배제
- **Feature-based Module**: 재고/고객/예약을 독립 모듈로 분리
- **Data Integrity**: 관계형 데이터(고객-차량-이력-예약) 일관성 보장

---

## 2. Architecture

### 2.1 System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser (Client)                       │
│  ┌─────────┐  ┌──────────┐  ┌────────────┐  ┌────────────┐  │
│  │Dashboard│  │Inventory │  │ Customers  │  │Reservations│  │
│  └────┬────┘  └────┬─────┘  └─────┬──────┘  └─────┬──────┘  │
│       └─────────────┴──────────────┴───────────────┘         │
│                            │                                  │
└────────────────────────────┼──────────────────────────────────┘
                             │ HTTP (fetch)
┌────────────────────────────┼──────────────────────────────────┐
│                    Next.js API Routes                          │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │ /api/inventory│  │/api/customers│  │ /api/reservations   │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬──────────────┘ │
│         │                 │                  │                 │
│         └─────────┬───────┘                  │                │
│                   │                          │                │
│          ┌────────▼────────┐      ┌──────────▼──────────┐    │
│          │  Prisma (SQLite) │      │ Google Calendar API │    │
│          │    Local DB      │      │   (OAuth 2.0)       │    │
│          └─────────────────┘      └─────────────────────┘    │
└───────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
[예약 생성 흐름]
사용자 입력 → react-hook-form 검증 → API Route 호출
  → Prisma DB 저장 → Google Calendar 이벤트 생성 → 응답 반환

[Google Calendar 동기화 흐름]
앱 예약 생성/수정/삭제 → Google Calendar API 호출 → calendarEventId 저장
Google Calendar 변경 → Webhook/Polling → 앱 DB 업데이트
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| Reservation API | Prisma, Google Calendar API | 예약 CRUD + 캘린더 동기화 |
| Customer API | Prisma | 고객/차량/이력 CRUD |
| Inventory API | Prisma | 재고 CRUD + 알림 |
| Dashboard | 모든 API | 통합 현황 표시 |

---

## 3. Data Model

### 3.1 Entity Definition (Prisma Schema)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ── 재고 관리 ──

model InventoryItem {
  id          String   @id @default(cuid())
  name        String                          // 부품명
  category    String                          // 카테고리 (엔진, 브레이크, 타이어 등)
  quantity    Int      @default(0)            // 현재 수량
  minQuantity Int      @default(5)            // 최소 수량 (알림 기준)
  unitPrice   Int      @default(0)            // 단가 (원)
  location    String?                         // 보관 위치
  memo        String?                         // 메모
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  stockLogs       StockLog[]
  servicePartUsed ServicePartUsed[]
}

model StockLog {
  id              String        @id @default(cuid())
  inventoryItemId String
  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id], onDelete: Cascade)
  type            String                      // "IN" | "OUT"
  quantity        Int                         // 입출고 수량
  reason          String?                     // 사유
  createdAt       DateTime      @default(now())
}

// ── 고객 관리 ──

model Customer {
  id        String   @id @default(cuid())
  name      String                            // 고객명
  phone     String?                           // 연락처
  memo      String?                           // 메모
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  vehicles     Vehicle[]
  reservations Reservation[]
}

model Vehicle {
  id          String   @id @default(cuid())
  customerId  String
  customer    Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  carModel    String                          // 차종 (예: 현대 아반떼 CN7)
  year        Int?                            // 연식
  plateNumber String?                         // 번호판
  mileage     Int?                            // 주행거리 (km)
  memo        String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  serviceRecords ServiceRecord[]
  reservations   Reservation[]
}

model ServiceRecord {
  id          String   @id @default(cuid())
  vehicleId   String
  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  serviceDate DateTime                        // 정비일
  serviceType String                          // 정비 | 튜닝 | 점검 | 기타
  description String                          // 작업 내용
  cost        Int      @default(0)            // 비용 (원)
  memo        String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  partsUsed ServicePartUsed[]
}

model ServicePartUsed {
  id              String        @id @default(cuid())
  serviceRecordId String
  serviceRecord   ServiceRecord @relation(fields: [serviceRecordId], references: [id], onDelete: Cascade)
  inventoryItemId String
  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id])
  quantity        Int                         // 사용 수량
}

// ── 예약 관리 ──

model Reservation {
  id              String   @id @default(cuid())
  customerId      String
  customer        Customer @relation(fields: [customerId], references: [id])
  vehicleId       String?
  vehicle         Vehicle? @relation(fields: [vehicleId], references: [id])
  scheduledAt     DateTime                    // 예약 일시
  duration        Int      @default(60)       // 예상 소요시간 (분)
  serviceType     String                      // 정비 | 튜닝 | 점검 | 기타
  description     String?                     // 작업 내용/요청사항
  status          String   @default("PENDING") // PENDING | CONFIRMED | COMPLETED | CANCELLED
  calendarEventId String?                     // Google Calendar 이벤트 ID
  memo            String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### 3.2 Entity Relationships

```
[Customer] 1 ──── N [Vehicle]
    │                   │
    │                   └── 1 ──── N [ServiceRecord]
    │                                      │
    │                                      └── N ──── N [InventoryItem]
    │                                           (through ServicePartUsed)
    │
    └── 1 ──── N [Reservation] N ──── 1 [Vehicle]

[InventoryItem] 1 ──── N [StockLog]
```

---

## 4. API Specification

### 4.1 Endpoint List

| Method | Path | Description | FR |
|--------|------|-------------|-----|
| **재고 관리** | | | |
| GET | `/api/inventory` | 부품 목록 (검색/필터) | FR-04 |
| POST | `/api/inventory` | 부품 등록 | FR-01 |
| PUT | `/api/inventory/[id]` | 부품 수정 | FR-01 |
| DELETE | `/api/inventory/[id]` | 부품 삭제 | FR-01 |
| POST | `/api/inventory/[id]/stock` | 입출고 기록 | FR-02 |
| GET | `/api/inventory/alerts` | 재고 부족 알림 목록 | FR-03 |
| **고객 관리** | | | |
| GET | `/api/customers` | 고객 목록 (검색) | FR-05 |
| POST | `/api/customers` | 고객 등록 | FR-05 |
| GET | `/api/customers/[id]` | 고객 상세 (차량+이력 포함) | FR-08 |
| PUT | `/api/customers/[id]` | 고객 수정 | FR-05 |
| DELETE | `/api/customers/[id]` | 고객 삭제 | FR-05 |
| POST | `/api/customers/[id]/vehicles` | 차량 등록 | FR-06 |
| PUT | `/api/vehicles/[id]` | 차량 수정 | FR-06 |
| DELETE | `/api/vehicles/[id]` | 차량 삭제 | FR-06 |
| POST | `/api/vehicles/[id]/services` | 정비 이력 등록 | FR-07 |
| PUT | `/api/services/[id]` | 정비 이력 수정 | FR-07 |
| DELETE | `/api/services/[id]` | 정비 이력 삭제 | FR-07 |
| **예약 관리** | | | |
| GET | `/api/reservations` | 예약 목록 (날짜 범위 필터) | FR-09 |
| POST | `/api/reservations` | 예약 생성 + Google Calendar 연동 | FR-09, FR-11 |
| PUT | `/api/reservations/[id]` | 예약 수정 + Google Calendar 업데이트 | FR-10, FR-11 |
| DELETE | `/api/reservations/[id]` | 예약 취소 + Google Calendar 삭제 | FR-10, FR-11 |
| **Google Calendar** | | | |
| GET | `/api/auth/google` | Google OAuth 시작 | FR-11 |
| GET | `/api/auth/google/callback` | OAuth 콜백 | FR-11 |
| POST | `/api/calendar/sync` | 수동 동기화 트리거 | FR-12 |
| **대시보드** | | | |
| GET | `/api/dashboard` | 대시보드 통합 데이터 | FR-13~15 |

### 4.2 Key API Details

#### `POST /api/reservations` (예약 생성 + Google Calendar)

**Request:**
```json
{
  "customerId": "string",
  "vehicleId": "string | null",
  "scheduledAt": "2026-03-15T10:00:00Z",
  "duration": 60,
  "serviceType": "정비",
  "description": "엔진오일 교환",
  "memo": "오전 방문 예정"
}
```

**Response (201 Created):**
```json
{
  "id": "cuid",
  "customerId": "string",
  "customer": { "name": "홍길동", "phone": "010-1234-5678" },
  "vehicleId": "string",
  "vehicle": { "carModel": "현대 아반떼 CN7", "plateNumber": "12가 3456" },
  "scheduledAt": "2026-03-15T10:00:00Z",
  "duration": 60,
  "serviceType": "정비",
  "description": "엔진오일 교환",
  "status": "PENDING",
  "calendarEventId": "google-event-id-xxx",
  "createdAt": "2026-03-09T..."
}
```

**Server Logic:**
1. Prisma DB에 예약 저장
2. Google Calendar API로 이벤트 생성
3. 반환된 `calendarEventId`를 DB에 업데이트
4. Calendar 연동 실패 시 → DB 저장은 유지, `calendarEventId = null`, 에러 로깅

#### `POST /api/inventory/[id]/stock` (입출고 기록)

**Request:**
```json
{
  "type": "IN",
  "quantity": 10,
  "reason": "월간 정기 발주"
}
```

**Server Logic:**
1. StockLog 생성
2. InventoryItem.quantity 자동 업데이트 (IN: +quantity, OUT: -quantity)
3. OUT 시 quantity < 0 방지 (400 에러)

#### `GET /api/dashboard` (대시보드)

**Response:**
```json
{
  "todayReservations": [],
  "weekReservations": [],
  "lowStockItems": [],
  "recentServices": []
}
```

---

## 5. Google Calendar Integration Design

### 5.1 OAuth 2.0 Flow

```
1. 사용자가 "Google Calendar 연결" 버튼 클릭
2. /api/auth/google → Google OAuth 동의 화면으로 리다이렉트
3. 사용자 동의 → /api/auth/google/callback
4. Access Token + Refresh Token 발급 → 로컬 파일/DB에 저장
5. 이후 API 호출 시 Access Token 사용 (만료 시 Refresh Token으로 갱신)
```

### 5.2 Token Storage

```
prisma/google-token.json (gitignore 대상)
{
  "access_token": "...",
  "refresh_token": "...",
  "expiry_date": 1234567890
}
```

### 5.3 Calendar Event Mapping

| Reservation Field | Calendar Event Field |
|-------------------|---------------------|
| `customer.name + serviceType` | `summary` (제목) |
| `description + vehicle info` | `description` (설명) |
| `scheduledAt` | `start.dateTime` |
| `scheduledAt + duration` | `end.dateTime` |
| 앱 URL | `source.url` |

**이벤트 제목 형식**: `[정비] 홍길동 - 아반떼 CN7`

### 5.4 Sync Strategy

| 방향 | 트리거 | 방법 |
|------|--------|------|
| App → Google | 예약 생성/수정/삭제 시 | 즉시 API 호출 |
| Google → App | 수동 동기화 버튼 | `/api/calendar/sync` 호출 |

> **Note**: 완전한 양방향 실시간 동기화(Webhook)는 v2에서 구현. v1은 앱→Google 자동 + Google→앱 수동 동기화.

---

## 6. UI/UX Design

### 6.1 Screen Layout

```
┌─────────────────────────────────────────────────────┐
│  🔧 Auto Shop Manager           [Google Calendar 🔗] │
├──────────┬──────────────────────────────────────────┤
│          │                                           │
│ Sidebar  │  Main Content Area                        │
│          │                                           │
│ 📊 대시보드│  ┌─────────────────────────────────────┐  │
│ 📦 재고    │  │                                     │  │
│ 👥 고객    │  │   (페이지별 콘텐츠)                   │  │
│ 📅 예약    │  │                                     │  │
│          │  └─────────────────────────────────────┘  │
│          │                                           │
└──────────┴──────────────────────────────────────────┘
```

**모바일 (< 768px):**
```
┌──────────────────────┐
│ 🔧 Auto Shop  [☰]    │
├──────────────────────┤
│                      │
│  Main Content Area   │
│                      │
├──────────────────────┤
│ 📊  📦  👥  📅       │  ← Bottom Tab Navigation
└──────────────────────┘
```

### 6.2 User Flow

```
[대시보드] ← 앱 진입점
  ├── 오늘 예약 → 클릭 → [예약 상세]
  ├── 재고 부족 알림 → 클릭 → [재고 상세]
  └── 최근 정비 → 클릭 → [정비 이력 상세]

[재고 관리]
  목록 → 검색/필터 → 상세 → 입출고 기록

[고객 관리]
  목록 → 검색 → 고객 상세 → 차량 목록 → 정비 이력

[예약 관리]
  캘린더뷰/리스트뷰 → 예약 생성 → Google Calendar 반영
```

### 6.3 Page & Component List

| Page | Route | Key Components |
|------|-------|---------------|
| 대시보드 | `/` | TodayReservations, LowStockAlerts, RecentServices |
| 재고 목록 | `/inventory` | InventoryTable, SearchBar, CategoryFilter |
| 재고 등록/수정 | `/inventory/new`, `/inventory/[id]` | InventoryForm |
| 입출고 기록 | `/inventory/[id]/stock` | StockLogForm, StockLogList |
| 고객 목록 | `/customers` | CustomerTable, SearchBar |
| 고객 상세 | `/customers/[id]` | CustomerInfo, VehicleList, ServiceHistory |
| 고객 등록/수정 | `/customers/new`, `/customers/[id]/edit` | CustomerForm |
| 차량 등록/수정 | `/customers/[id]/vehicles/new` | VehicleForm |
| 정비 이력 등록 | `/vehicles/[id]/services/new` | ServiceRecordForm, PartSelector |
| 예약 목록 | `/reservations` | ReservationCalendar, ReservationList |
| 예약 생성/수정 | `/reservations/new`, `/reservations/[id]` | ReservationForm, CustomerSelector |

### 6.4 Shared Components

| Component | Location | Purpose |
|-----------|----------|---------|
| AppLayout | `src/components/layout/` | Sidebar + Header + Main |
| DataTable | `src/components/ui/` | shadcn/ui Table wrapper |
| SearchBar | `src/components/ui/` | 검색 입력 |
| FormField | `src/components/ui/` | react-hook-form + shadcn/ui |
| ConfirmDialog | `src/components/ui/` | 삭제 확인 모달 |
| StatusBadge | `src/components/ui/` | 예약 상태 배지 |
| EmptyState | `src/components/ui/` | 데이터 없음 표시 |

---

## 7. Error Handling

| Code | 상황 | 처리 |
|------|------|------|
| 400 | 입력값 유효성 실패 | toast 에러 메시지 표시 |
| 404 | 리소스 없음 | "데이터를 찾을 수 없습니다" 표시 |
| 500 | 서버 에러 | toast "오류가 발생했습니다" + 콘솔 로깅 |
| - | Google Calendar 연동 실패 | DB 저장은 유지, "캘린더 동기화 실패" 경고 표시 |
| - | Google 토큰 만료 | 자동 갱신 시도, 실패 시 재인증 안내 |

---

## 8. Security Considerations

- [x] Input validation (zod schema)
- [x] Google OAuth 토큰 로컬 안전 저장 (.gitignore)
- [x] SQL Injection 방지 (Prisma ORM 사용)
- [ ] HTTPS (배포 시 적용)
- [x] 환경 변수로 민감 정보 분리 (.env.local)

---

## 9. File Structure

```
auto-shop-manager/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout (AppLayout)
│   │   ├── page.tsx                      # Dashboard
│   │   ├── inventory/
│   │   │   ├── page.tsx                  # 재고 목록
│   │   │   ├── new/page.tsx              # 재고 등록
│   │   │   └── [id]/
│   │   │       ├── page.tsx              # 재고 상세/수정
│   │   │       └── stock/page.tsx        # 입출고 기록
│   │   ├── customers/
│   │   │   ├── page.tsx                  # 고객 목록
│   │   │   ├── new/page.tsx              # 고객 등록
│   │   │   └── [id]/
│   │   │       ├── page.tsx              # 고객 상세
│   │   │       ├── edit/page.tsx         # 고객 수정
│   │   │       └── vehicles/
│   │   │           └── new/page.tsx      # 차량 등록
│   │   ├── vehicles/
│   │   │   └── [id]/
│   │   │       └── services/
│   │   │           └── new/page.tsx      # 정비 이력 등록
│   │   ├── reservations/
│   │   │   ├── page.tsx                  # 예약 목록 (캘린더뷰)
│   │   │   ├── new/page.tsx              # 예약 생성
│   │   │   └── [id]/page.tsx             # 예약 상세/수정
│   │   └── api/
│   │       ├── inventory/
│   │       │   ├── route.ts              # GET (목록), POST (등록)
│   │       │   ├── alerts/route.ts       # GET (부족 알림)
│   │       │   └── [id]/
│   │       │       ├── route.ts          # GET, PUT, DELETE
│   │       │       └── stock/route.ts    # POST (입출고)
│   │       ├── customers/
│   │       │   ├── route.ts              # GET, POST
│   │       │   └── [id]/
│   │       │       ├── route.ts          # GET, PUT, DELETE
│   │       │       └── vehicles/route.ts # POST
│   │       ├── vehicles/
│   │       │   └── [id]/
│   │       │       ├── route.ts          # PUT, DELETE
│   │       │       └── services/route.ts # POST
│   │       ├── services/
│   │       │   └── [id]/route.ts         # PUT, DELETE
│   │       ├── reservations/
│   │       │   ├── route.ts              # GET, POST
│   │       │   └── [id]/route.ts         # GET, PUT, DELETE
│   │       ├── dashboard/route.ts        # GET
│   │       ├── auth/
│   │       │   └── google/
│   │       │       ├── route.ts          # GET (OAuth 시작)
│   │       │       └── callback/route.ts # GET (콜백)
│   │       └── calendar/
│   │           └── sync/route.ts         # POST (수동 동기화)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── MobileNav.tsx
│   │   └── ui/                           # shadcn/ui 컴포넌트
│   ├── features/
│   │   ├── inventory/
│   │   │   ├── components/               # InventoryTable, InventoryForm, StockLogForm
│   │   │   ├── hooks/                    # useInventory, useStockLog
│   │   │   └── api.ts                    # API 호출 함수
│   │   ├── customers/
│   │   │   ├── components/               # CustomerTable, CustomerForm, VehicleForm
│   │   │   ├── hooks/                    # useCustomers, useVehicles
│   │   │   └── api.ts
│   │   └── reservations/
│   │       ├── components/               # ReservationCalendar, ReservationForm
│   │       ├── hooks/                    # useReservations
│   │       └── api.ts
│   ├── lib/
│   │   ├── prisma.ts                     # Prisma client singleton
│   │   ├── google-calendar.ts            # Google Calendar API wrapper
│   │   └── utils.ts                      # 유틸리티 함수
│   ├── types/
│   │   ├── inventory.ts
│   │   ├── customer.ts
│   │   └── reservation.ts
│   └── store/
│       └── useAppStore.ts                # Zustand global store
├── prisma/
│   ├── schema.prisma
│   └── google-token.json                 # Google OAuth 토큰 (gitignore)
├── public/
├── .env.local                            # 환경 변수
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

---

## 10. Implementation Order

### Phase 1: 프로젝트 초기 설정
1. [ ] Next.js 프로젝트 생성 (TypeScript, Tailwind, App Router)
2. [ ] shadcn/ui 초기화
3. [ ] Prisma 설정 + SQLite 연결
4. [ ] DB 스키마 마이그레이션
5. [ ] AppLayout (Sidebar + Header) 구현

### Phase 2: 재고 관리 (FR-01~04)
6. [ ] 재고 API (CRUD + 입출고)
7. [ ] 재고 목록 페이지 (검색/필터)
8. [ ] 재고 등록/수정 폼
9. [ ] 입출고 기록 페이지
10. [ ] 재고 부족 알림 API

### Phase 3: 고객 관리 (FR-05~08)
11. [ ] 고객 API (CRUD)
12. [ ] 차량 API (CRUD)
13. [ ] 정비 이력 API (CRUD + 부품 연결)
14. [ ] 고객 목록/검색 페이지
15. [ ] 고객 상세 페이지 (차량 + 이력)
16. [ ] 고객/차량/이력 등록 폼

### Phase 4: 예약 관리 + Google Calendar (FR-09~12)
17. [ ] 예약 API (CRUD)
18. [ ] Google OAuth 설정 + 토큰 관리
19. [ ] Google Calendar API wrapper (생성/수정/삭제)
20. [ ] 예약 생성 시 Google Calendar 자동 연동
21. [ ] 예약 목록 (캘린더뷰 + 리스트뷰)
22. [ ] 예약 생성/수정 폼
23. [ ] 수동 동기화 기능

### Phase 5: 대시보드 + 마무리 (FR-13~15)
24. [ ] 대시보드 API
25. [ ] 대시보드 UI (오늘 예약, 재고 알림, 최근 정비)
26. [ ] 반응형 레이아웃 확인
27. [ ] 최종 테스트 및 빌드

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-09 | Initial draft | ROSSA |
