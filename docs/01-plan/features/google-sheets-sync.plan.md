# Google Sheets Sync Planning Document

> **Summary**: 고객/예약 데이터를 Google Sheets에 자동 동기화하여 직원이 스프레드시트에서 편리하게 조회/관리
>
> **Project**: auto-shop-manager
> **Version**: 1.0.0
> **Author**: BIGS MOTORS
> **Date**: 2026-03-13
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

앱 내 고객/예약 데이터를 Google Sheets에 실시간 동기화하여, 직원들이 스프레드시트에서 편리하게 데이터를 조회하고 관리할 수 있게 한다.

### 1.2 Background

- 정비소 직원들은 스프레드시트 환경에 익숙하며, 앱 외부에서도 고객 정보를 빠르게 확인하고 싶어함
- Google Calendar 연동은 이미 구현되어 있어 Google API 인프라를 재사용 가능
- DB(SQLite)는 앱의 정상 운영을 위한 원본 데이터로 유지하고, Google Sheets는 뷰/보조 관리용으로 활용

### 1.3 Related Documents

- Design: `docs/02-design/features/google-sheets-sync.design.md`
- 기존 Google Calendar 구현: `src/lib/google-calendar.ts`

---

## 2. Scope

### 2.1 In Scope

- [x] 고객 등록/수정 시 Google Sheets 자동 동기화 (DB → Sheets)
- [x] 예약 등록/수정/삭제 시 Google Sheets 자동 동기화
- [x] Google Sheets API OAuth 인증 (기존 Calendar OAuth 재사용)
- [x] 수동 전체 동기화 API (기존 데이터 일괄 내보내기)
- [x] 시트 자동 생성 (고객 시트, 예약 시트)

### 2.2 Out of Scope

- Google Sheets → DB 역방향 동기화 (시트 수정이 앱에 반영되지 않음)
- 재고/부품 데이터 동기화 (1차 범위 외)
- 실시간 양방향 동기화 (복잡도 높아 제외)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 고객 생성 시 Google Sheets "고객" 시트에 행 추가 | High | Pending |
| FR-02 | 예약 생성 시 Google Sheets "예약" 시트에 행 추가 | High | Pending |
| FR-03 | 예약 수정/삭제 시 해당 행 업데이트/삭제 | High | Pending |
| FR-04 | 수동 전체 동기화 API (/api/sheets/sync) | Medium | Pending |
| FR-05 | 시트 미존재 시 자동 생성 + 헤더 설정 | Medium | Pending |
| FR-06 | 동기화 실패 시 앱 정상 운영 보장 (graceful degradation) | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 동기화가 API 응답 시간에 200ms 이상 추가하지 않음 | 비동기 처리 |
| Reliability | Sheets API 실패 시 DB 작업에 영향 없음 | try-catch 격리 |
| Security | Google OAuth 토큰을 서버 사이드에서만 관리 | 토큰 파일 접근 제한 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [x] 고객/예약 CRUD 시 Google Sheets에 자동 반영
- [x] 수동 동기화로 기존 데이터 일괄 내보내기 가능
- [x] Sheets API 실패 시에도 앱 정상 작동
- [x] 빌드 성공 (TypeScript 에러 없음)

### 4.2 Quality Criteria

- [x] Zero lint errors
- [x] Build succeeds
- [x] Google Sheets 연결/미연결 상태 모두 정상 동작

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Google Sheets API 속도 제한 (분당 60요청) | Medium | Medium | 비동기 처리 + 배치 동기화 |
| OAuth 스코프 추가 시 재인증 필요 | Low | High | 기존 Calendar 인증에 Sheets 스코프 추가 |
| 시트 데이터 수동 편집 시 불일치 | Medium | High | 단방향(DB→Sheets)만 지원, 시트는 읽기 전용으로 안내 |
| 대량 데이터 동기화 시 타임아웃 | Low | Low | 페이지네이션 적용 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Selected |
|-------|:--------:|
| **Dynamic** | ✅ |

### 6.2 Key Architectural Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| Google API Client | googleapis | 이미 Calendar에서 사용 중 |
| 동기화 방식 | 비동기 (fire-and-forget) | API 응답 속도에 영향 없게 |
| 데이터 흐름 | DB → Sheets (단방향) | 복잡도 최소화, DB가 원본 |
| 시트 구조 | 고객/예약 별도 시트 | 시트 목적별 분리 |

### 6.3 구현 구조

```
src/lib/google-sheets.ts          # Sheets API 클라이언트 + CRUD
src/app/api/sheets/sync/route.ts  # 수동 전체 동기화 API
src/app/api/sheets/status/route.ts # 연결 상태 확인
.env.local                         # GOOGLE_SHEET_ID 추가
```

---

## 7. Convention Prerequisites

### 7.1 환경 변수

| Variable | Purpose | Scope |
|----------|---------|-------|
| `GOOGLE_CLIENT_ID` | OAuth (기존) | Server |
| `GOOGLE_CLIENT_SECRET` | OAuth (기존) | Server |
| `GOOGLE_SHEET_ID` | 동기화 대상 시트 ID | Server |

### 7.2 OAuth 스코프 추가

기존: `https://www.googleapis.com/auth/calendar`
추가: `https://www.googleapis.com/auth/spreadsheets`

---

## 8. Next Steps

1. [x] Write design document (`google-sheets-sync.design.md`)
2. [ ] Implement google-sheets.ts
3. [ ] Integrate with existing CRUD APIs
4. [ ] Test with live Google Sheet

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-13 | Initial draft | BIGS MOTORS |
