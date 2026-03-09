# Auto Shop Manager 기획서

> **Summary**: 자동차 정비 & 튜닝샵을 위한 재고/고객/예약 관리 웹 애플리케이션
>
> **Project**: auto-shop-manager
> **Author**: ROSSA
> **Date**: 2026-03-09
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

자동차 정비 및 튜닝샵 운영에 필요한 **재고 관리**, **고객 관리**, **예약 일정 관리**를 하나의 웹 앱에서 통합 관리한다. 예약 일정은 **Google Calendar API**와 연동하여 캘린더에서도 확인/관리 가능하게 한다.

### 1.2 Background

- 1인 운영 정비/튜닝샵에서 엑셀이나 수기 관리의 비효율을 해소
- 부품 재고 파악, 고객 차량 이력 추적, 예약 스케줄 관리를 체계화
- Google Calendar 연동으로 모바일에서도 일정 확인 가능

---

## 2. Scope

### 2.1 In Scope

- [x] 재고 관리 (부품/소모품 입출고, 현황 조회, 부족 알림)
- [x] 고객 관리 (고객 정보, 차량 정보, 정비/튜닝 이력)
- [x] 예약 일정 관리 (예약 CRUD → Google Calendar 양방향 연동)
- [x] 대시보드 (오늘의 예약, 재고 부족 알림, 최근 정비 현황)

### 2.2 Out of Scope

- 결제/매출 관리 (향후 확장 가능)
- 멀티 유저/권한 관리 (1인 사용)
- 모바일 앱 (웹 반응형으로 대체)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| **재고 관리** | | | |
| FR-01 | 부품/소모품 등록 (이름, 카테고리, 수량, 단가, 위치) | High | Pending |
| FR-02 | 입고/출고 기록 및 재고 자동 업데이트 | High | Pending |
| FR-03 | 재고 부족 알림 (최소 수량 설정) | Medium | Pending |
| FR-04 | 부품 검색 및 필터링 | Medium | Pending |
| **고객 관리** | | | |
| FR-05 | 고객 등록 (이름, 연락처, 메모) | High | Pending |
| FR-06 | 차량 등록 (차종, 연식, 번호판, 주행거리) | High | Pending |
| FR-07 | 정비/튜닝 이력 관리 (날짜, 작업 내용, 사용 부품, 비용) | High | Pending |
| FR-08 | 고객별 차량 및 이력 조회 | Medium | Pending |
| **예약 일정** | | | |
| FR-09 | 예약 생성 (고객, 차량, 날짜/시간, 작업 유형, 메모) | High | Pending |
| FR-10 | 예약 수정/취소 | High | Pending |
| FR-11 | Google Calendar 연동 (예약 생성 시 캘린더 이벤트 자동 생성) | High | Pending |
| FR-12 | Google Calendar 변경 시 앱에 반영 (양방향 동기화) | Medium | Pending |
| **대시보드** | | | |
| FR-13 | 오늘/이번 주 예약 현황 | Medium | Pending |
| FR-14 | 재고 부족 알림 표시 | Medium | Pending |
| FR-15 | 최근 정비 완료 내역 | Low | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 페이지 로딩 < 2초 | Lighthouse |
| Responsive | 모바일/태블릿/PC 대응 | 브라우저 테스트 |
| Data Safety | 데이터 백업 가능 | DB export 기능 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 모든 Functional Requirements 구현 완료
- [ ] Google Calendar 연동 정상 동작
- [ ] 반응형 레이아웃 적용
- [ ] 빌드 및 배포 성공

### 4.2 Quality Criteria

- [ ] 주요 기능 정상 동작 확인
- [ ] Zero lint errors
- [ ] Build 성공

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Google Calendar API 인증 복잡성 | High | Medium | OAuth 2.0 플로우 사전 구현/테스트 |
| Google API 일일 호출 제한 | Medium | Low | 배치 처리, 캐싱 적용 |
| 데이터 손실 | High | Low | 정기 백업 및 DB export 기능 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites | ☐ |
| **Dynamic** | Feature-based modules, BaaS integration | Web apps with backend | ☑ |
| **Enterprise** | Strict layer separation, microservices | High-traffic systems | ☐ |

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Framework | Next.js / React / Vue | **Next.js (App Router)** | SSR, API Routes, 풀스택 가능 |
| State Management | Context / Zustand / Redux | **Zustand** | 경량, 간단한 API |
| Database | SQLite / PostgreSQL / BaaS | **SQLite (Prisma)** | 1인 사용, 로컬 배포 간편 |
| Styling | Tailwind / CSS Modules | **Tailwind CSS** | 빠른 UI 개발 |
| UI Components | shadcn/ui / MUI / Ant Design | **shadcn/ui** | Tailwind 기반, 커스터마이징 용이 |
| Calendar API | Google Calendar API v3 | **Google Calendar API v3** | 공식 API, 무료 |
| Form Handling | react-hook-form / native | **react-hook-form** | 폼 유효성 검사 간편 |

### 6.3 Clean Architecture Approach

```
Selected Level: Dynamic

Folder Structure Preview:
auto-shop-manager/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # 대시보드
│   │   ├── inventory/          # 재고 관리
│   │   ├── customers/          # 고객 관리
│   │   ├── reservations/       # 예약 관리
│   │   └── api/                # API Routes
│   ├── components/             # 공통 UI 컴포넌트
│   ├── features/               # 기능별 모듈
│   │   ├── inventory/          # 재고 관련 로직
│   │   ├── customers/          # 고객 관련 로직
│   │   └── reservations/       # 예약 관련 로직 + Google Calendar
│   ├── lib/                    # 유틸리티
│   │   ├── prisma.ts           # Prisma client
│   │   └── google-calendar.ts  # Google Calendar API wrapper
│   └── types/                  # TypeScript 타입 정의
├── prisma/
│   └── schema.prisma           # DB 스키마
└── .env.local                  # 환경 변수 (Google API keys)
```

---

## 7. Convention Prerequisites

### 7.1 Conventions to Define/Verify

| Category | To Define | Priority |
|----------|-----------|:--------:|
| **Naming** | camelCase (변수), PascalCase (컴포넌트), kebab-case (파일) | High |
| **Folder structure** | Feature-based module 구조 | High |
| **Import order** | React → 외부 라이브러리 → 내부 모듈 → 타입 | Medium |

### 7.2 Environment Variables Needed

| Variable | Purpose | Scope |
|----------|---------|-------|
| `GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID | Server |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 클라이언트 시크릿 | Server |
| `GOOGLE_REDIRECT_URI` | OAuth 리다이렉트 URI | Server |
| `DATABASE_URL` | SQLite DB 경로 | Server |

---

## 8. Tech Stack Summary

```
Frontend:  Next.js 15 (App Router) + TypeScript
UI:        Tailwind CSS + shadcn/ui
State:     Zustand
Forms:     react-hook-form + zod
Database:  SQLite + Prisma ORM
Calendar:  Google Calendar API v3 (OAuth 2.0)
```

---

## 9. Next Steps

1. [ ] Design 문서 작성 (`auto-shop-manager.design.md`)
2. [ ] DB 스키마 설계 (Prisma)
3. [ ] Google Calendar API 연동 설계
4. [ ] UI 와이어프레임 설계
5. [ ] 구현 시작

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-09 | Initial draft | ROSSA |
