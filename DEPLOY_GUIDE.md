# BIGS MOTORS 오토샵 매니저 - 배포 가이드

> 이 문서를 읽은 AI는 아래 내용을 참고하세요.

## 현재 상태 (2026-03-21 기준)

- 프레임워크: Next.js 16.1.6 (App Router)
- ORM: Prisma (PostgreSQL)
- DB: Supabase PostgreSQL (서울 리전 ap-northeast-2, 프로젝트ID: hhddzuyfoalrgbwokbfs)
- 배포: Vercel (서울 리전 icn1, 프로젝트명: bigs-motors-manager)
- URL: https://bigs-motors-manager.vercel.app
- GitHub: https://github.com/aijunny0604-alt/auto-shop-manager (public)
- Google Calendar: 연동 완료 (토큰 DB 저장, 설정 페이지에서 변경/해제 가능)

---

## Vercel 배포 제어 ([deploy] 키워드 방식)

### 설정
Vercel 대시보드 → Settings → Build and Deployment → Ignored Build Step → Custom:

```bash
[[ "$VERCEL_GIT_COMMIT_MESSAGE" == *"[deploy]"* ]] && exit 1 || exit 0
```

### 동작 방식
- 커밋 메시지에 `[deploy]` 포함 → 자동 배포됨
- 커밋 메시지에 `[deploy]` 없음 → 빌드 무시 (사용량 절약)

### 예시
```bash
git commit -m "fix: 버그 수정"          # → push해도 배포 안 됨
git commit -m "fix: 버그 수정 [deploy]" # → push하면 자동 배포
```

---

## 환경변수

### 로컬 (.env.local)
```env
DATABASE_URL="postgresql://postgres.{project-id}:{비밀번호}@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.{project-id}:{비밀번호}@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
GOOGLE_CLIENT_ID="(Google Cloud Console에서 확인)"
GOOGLE_CLIENT_SECRET="(Google Cloud Console에서 확인)"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
```

### Vercel 환경변수 (5개)
| Name | 설명 |
|------|------|
| `DATABASE_URL` | Supabase Transaction pooler (포트 6543, 서울 리전) |
| `DIRECT_URL` | Supabase Session pooler (포트 5432, 서울 리전) |
| `GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 시크릿 |
| `GOOGLE_REDIRECT_URI` | `https://bigs-motors-manager.vercel.app/api/auth/google/callback` |

---

## Google Calendar 연동

### Google Cloud Console 설정
- OAuth 클라이언트 ID: 웹 애플리케이션 타입
- 승인된 리디렉션 URI:
  - `http://localhost:3000/api/auth/google/callback` (로컬)
  - `https://bigs-motors-manager.vercel.app/api/auth/google/callback` (프로덕션)

### 토큰 저장 방식
- DB 저장 (GoogleToken 테이블) - Vercel 서버리스 환경 호환
- 한번 로그인하면 refresh token으로 자동 갱신되어 재로그인 불필요

### 계정 변경/해제
- 설정/백업 페이지에서 "다른 계정으로 변경" 또는 "연동 해제" 가능

---

## Prisma 스키마 (10개 모델)

| 모델 | 설명 |
|------|------|
| Customer | 고객 |
| Vehicle | 차량 |
| Reservation | 예약 |
| ServiceRecord | 정비 기록 |
| ServicePartUsed | 정비 부품 사용 |
| InventoryItem | 재고 |
| StockLog | 입출고 이력 |
| Estimate | 견적서 |
| EstimateItem | 견적 항목 |
| ImportHistory | 임포트 이력 |
| GoogleToken | Google OAuth 토큰 저장 |

### DB 인덱스
- Customer: name
- InventoryItem: category, quantity
- Reservation: scheduledAt, customerId, status
- StockLog: inventoryItemId + createdAt
- Estimate: customerId, estimateNo, createdAt

### 관계
- Customer → Vehicle (1:N)
- Customer → Reservation (1:N)
- Customer → Estimate (1:N)
- Vehicle → ServiceRecord (1:N)
- Vehicle → Reservation (1:N)
- Vehicle → Estimate (1:N)
- ServiceRecord → ServicePartUsed (1:N)
- InventoryItem → StockLog (1:N)
- InventoryItem → ServicePartUsed (1:N)
- Estimate → EstimateItem (1:N)

---

## API 라우트 (28개)

| 경로 | 메서드 | 설명 |
|------|--------|------|
| /api/auth/google | GET | Google OAuth 인증 시작 |
| /api/auth/google/callback | GET | OAuth 콜백 |
| /api/auth/google/disconnect | POST | Google 연동 해제 |
| /api/dashboard | GET | 대시보드 통계 |
| /api/customers | GET, POST | 고객 목록/생성 (이름+전화번호 OR 검색) |
| /api/customers/[id] | GET, PUT, DELETE | 고객 상세/수정/삭제 |
| /api/customers/[id]/vehicles | GET, POST | 고객 차량 목록/등록 |
| /api/vehicles/[id] | GET | 차량 상세 |
| /api/vehicles/[id]/services | GET | 차량 정비 이력 |
| /api/reservations | GET, POST | 예약 목록/생성 (날짜+상태+서비스유형 필터) |
| /api/reservations/[id] | GET, PUT, DELETE | 예약 상세/수정/삭제 |
| /api/estimates | GET, POST | 견적서 목록/생성 (날짜+상태 필터, 신규고객 인라인 생성) |
| /api/estimates/[id] | GET, PUT, DELETE | 견적서 상세/수정/삭제 |
| /api/inventory | GET, POST | 재고 목록/등록 (카테고리+재고부족 필터) |
| /api/inventory/[id] | GET, PUT, DELETE | 재고 상세/수정/삭제 |
| /api/inventory/[id]/stock | POST | 입출고 기록 |
| /api/inventory/alerts | GET | 재고 부족 알림 |
| /api/inventory/export | GET | Excel 내보내기 |
| /api/inventory/import | POST | CSV/Excel 가져오기 |
| /api/inventory/import/preview | POST | 가져오기 미리보기 |
| /api/services/[id] | GET | 정비 기록 상세 |
| /api/revenue | GET | 매출 통계 (기간별/유형별) |
| /api/calendar/status | GET | Google Calendar 연결 상태 |
| /api/calendar/events | GET | 캘린더 이벤트 목록 |
| /api/calendar/sync | POST | 예약→캘린더 동기화 |
| /api/sheets/status | GET | Sheets 연결 상태 |
| /api/sheets/sync | POST | Sheets 동기화 |
| /api/backup/export | GET | 데이터 백업 (JSON 다운로드) |
| /api/backup/import | POST | 데이터 복원 (JSON 업로드) |

---

## 성능 최적화 (적용 완료)

- Supabase 서울 리전 (ap-northeast-2): 호주 대비 API 응답 4~10배 향상
- Vercel 서울 리전 (icn1): 서버리스 함수도 서울에서 실행
- DB 인덱스 추가 (검색/조회 속도 향상)
- 대시보드 API: DB 레벨 필터링 + 쿼리 병렬 실행
- Prisma 싱글턴 패턴 (DB 연결 재사용)
- Vercel Cold Start: 첫 요청 1~3초, 이후 빠름 (서버리스 특성)

---

## 비용

| 서비스 | 무료 플랜 | 비고 |
|--------|-----------|------|
| Vercel | 빌드 6,000분/월, 100GB 대역폭 | [deploy] 키워드로 빌드 절약 |
| Supabase | DB 500MB, 5GB/월 대역폭 | 7일 미사용 시 일시정지 |
| Google API | 무료 (일일 쿼터) | 소규모 사용 여유 |

---

## 인수인계

별도 문서 참고: [HANDOVER_GUIDE.md](HANDOVER_GUIDE.md)
