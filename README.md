# Auto Shop Manager

BIGS MOTORS 자동차 정비소 관리 시스템

## 주요 기능

### 예약 관리
- 예약 등록/수정/삭제 (CRUD)
- 고객 자동완성 검색 + 신규 고객 자동 생성
- 예약 상태 관리 (대기/확정/완료/취소)
- Google Calendar 자동 연동 (이벤트 생성/수정/삭제)

### Google Calendar 연동
- OAuth 2.0 인증으로 Google Calendar 연결
- 예약 등록 시 캘린더 이벤트 자동 생성
- 앱 내 캘린더 페이지 (월간 달력 뷰 + 목록 뷰)
- 날짜 클릭 시 일정 상세 모달

### Google Sheets 동기화
- 고객/예약 데이터 Google Sheets 자동 동기화
- 수동 전체 동기화 기능
- 비동기 fire-and-forget 패턴 (실패해도 예약은 유지)

### 고객 관리
- 고객 등록/수정/삭제
- 차량 등록 및 정비 이력 관리
- 고객별 차량/예약 현황 조회

### 재고 관리
- 부품 등록/수정/삭제
- 카테고리 선택 + 직접 추가 (combobox)
- 입출고 기록 및 재고 부족 알림
- 대시보드에서 저재고 알림

## 기술 스택

| 분류 | 기술 |
|------|------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Form | React Hook Form + Zod |
| Database | SQLite + Prisma ORM |
| Google API | Calendar v3, Sheets v4, OAuth 2.0 |

## 시작하기

```bash
# 의존성 설치
npm install

# DB 초기화
npx prisma migrate dev

# 개발 서버
npm run dev
```

## 환경 변수 (.env.local)

```env
DATABASE_URL="file:./dev.db"

# Google OAuth 2.0 (Google Cloud Console에서 발급)
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"

# Google Sheets (시트 URL에서 ID 복사)
GOOGLE_SHEET_ID="your-sheet-id"
```

## Google API 설정

1. [Google Cloud Console](https://console.cloud.google.com) 에서 프로젝트 생성
2. Google Calendar API, Google Sheets API 활성화
3. OAuth 2.0 클라이언트 ID 생성 (웹 애플리케이션)
4. 승인된 리디렉션 URI: `http://localhost:3000/api/auth/google/callback`
5. `.env.local`에 클라이언트 ID/Secret 입력
6. 앱에서 `/api/auth/google` 접속하여 인증

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── api/                # API 라우트
│   ├── calendar/           # Google Calendar 페이지
│   ├── customers/          # 고객 관리
│   ├── inventory/          # 재고 관리
│   └── reservations/       # 예약 관리
├── components/
│   ├── layout/             # Sidebar, Header, MobileNav
│   └── ui/                 # 공용 UI 컴포넌트
├── features/               # API 클라이언트 함수
├── lib/                    # Google Calendar/Sheets, Prisma, 유틸
├── store/                  # Zustand 전역 상태
└── types/                  # TypeScript 타입 정의
```
