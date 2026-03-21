# BIGS MOTORS Auto Shop Manager

BIGS MOTORS 자동차 정비소 통합 관리 시스템

## 주요 기능

### 예약 관리
- 예약 등록/수정/삭제 (CRUD)
- 고객 자동완성 검색 + 신규 고객 인라인 등록
- 예약 상태 관리 (대기/확정/완료/취소)
- 날짜 범위 / 상태 / 서비스 유형 필터
- Google Calendar 자동 연동 (이벤트 생성/수정/삭제)

### 고객 관리
- 고객 등록/수정/삭제
- 차량 등록 및 정비 이력 관리
- 고객명 + 전화번호 통합 검색

### 견적서 관리
- 견적서 작성 (공임/부품 항목, 할인)
- 신규 고객 인라인 등록 지원
- 견적번호 자동 생성 (EST-YYYYMMDD-NNN)
- 상태 관리 (작성중/발송/승인/거절)
- 인쇄용 페이지
- 날짜 범위 / 상태 필터

### 재고 관리
- 부품 등록/수정/삭제
- 카테고리별 분류 + 재고 부족 필터
- 입출고 기록 및 재고 부족 알림
- CSV/Excel 가져오기/내보내기

### 매출 관리
- 오늘/이번주/이번달/3개월/직접입력 기간별 매출 통계
- 일별 매출 추이 차트 (CSS 기반)
- 서비스 유형별 매출 분석
- 승인 견적 금액 집계

### Google Calendar 연동
- OAuth 2.0 인증
- 예약 등록/수정/삭제 시 캘린더 자동 동기화
- 앱 내 캘린더 페이지 (월간 달력 + 목록 뷰)

### Google Sheets 동기화
- 고객/예약 데이터 자동 동기화
- 수동 전체 동기화 기능

### 데이터 백업/복원
- 전체 데이터 JSON 내보내기
- 백업 파일로 데이터 복원 (트랜잭션 기반)
- 마지막 백업 일시 표시

### UX/UI
- Glassmorphism 프리미엄 다크 테마
- 카드 클릭으로 상세 페이지 이동
- 호버 애니메이션 (translateY + 그림자)
- 모바일 반응형 (MobileNav)

## 기술 스택

| 분류 | 기술 |
|------|------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Form | React Hook Form + Zod |
| Database | Supabase PostgreSQL + Prisma ORM |
| Google API | Calendar v3, Sheets v4, OAuth 2.0 |
| Deployment | Vercel (서울 리전) |

## 시작하기

```bash
# 의존성 설치
npm install

# Prisma 클라이언트 생성
npx prisma generate

# DB 스키마 동기화
npx prisma db push

# 개발 서버
npm run dev
```

## 환경 변수 (.env.local)

```env
# Supabase PostgreSQL (서울 리전)
DATABASE_URL="postgresql://postgres.{project-id}:{password}@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.{project-id}:{password}@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"

# Google OAuth 2.0
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
```

## Google API 설정

1. [Google Cloud Console](https://console.cloud.google.com) 에서 프로젝트 생성
2. Google Calendar API, Google Sheets API 활성화
3. OAuth 2.0 클라이언트 ID 생성 (웹 애플리케이션)
4. 승인된 리디렉션 URI: `http://localhost:3000/api/auth/google/callback`
5. `.env.local`에 클라이언트 ID/Secret 입력
6. 앱에서 Google Calendar 연결 버튼 클릭하여 인증

## 프로젝트 구조

```
src/
├── app/
│   ├── api/                    # API 라우트 (25개)
│   │   ├── auth/google/        # Google OAuth
│   │   ├── backup/             # 백업/복원
│   │   ├── customers/          # 고객 API
│   │   ├── estimates/          # 견적서 API
│   │   ├── inventory/          # 재고 API
│   │   ├── reservations/       # 예약 API
│   │   ├── revenue/            # 매출 API
│   │   └── ...                 # 캘린더, 시트, 대시보드
│   ├── calendar/               # 캘린더 페이지
│   ├── customers/              # 고객 관리 페이지
│   ├── estimates/              # 견적서 페이지
│   ├── inventory/              # 재고 관리 페이지
│   ├── reservations/           # 예약 관리 페이지
│   ├── revenue/                # 매출 관리 페이지
│   └── settings/               # 설정/백업 페이지
├── components/
│   ├── layout/                 # Sidebar, Header, MobileNav
│   └── ui/                     # 공용 UI 컴포넌트
├── features/                   # API 클라이언트 함수
├── lib/                        # Google Calendar/Sheets, Prisma, 유틸
├── store/                      # Zustand 전역 상태
└── types/                      # TypeScript 타입 정의
```

## 배포

- **호스팅**: Vercel (서울 리전 icn1)
- **DB**: Supabase PostgreSQL (서울 리전 ap-northeast-2)
- 커밋 메시지에 `[deploy]` 포함 시 자동 배포
