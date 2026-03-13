# Changelog

## [2026-03-13] - Google Sheets Sync 기능 완성

### Added
- **Google Sheets API 통합**: DB 데이터를 Google Sheets에 자동 동기화
  - `src/lib/google-sheets.ts`: 핵심 모듈 (7개 함수)
    - `isSheetConnected()`: 연결 상태 확인
    - `ensureSheets()`: 시트 자동 생성 + 헤더 설정
    - `syncCustomerToSheet()`: 고객 정보 행 추가
    - `syncReservationToSheet()`: 예약 정보 행 추가
    - `updateReservationInSheet()`: 예약 정보 행 업데이트
    - `deleteReservationFromSheet()`: 예약 정보 행 삭제
    - `fullSync()`: 전체 데이터 일괄 동기화

- **새로운 API 엔드포인트**
  - `GET /api/sheets/status`: Sheets 연결 상태 확인
  - `POST /api/sheets/sync`: 수동 전체 동기화 (기존 데이터 내보내기)

- **OAuth 스코프 확장**
  - `src/lib/google-calendar.ts`: `spreadsheets` 스코프 추가

- **환경변수**
  - `GOOGLE_SHEET_ID`: 동기화 대상 Google Sheet ID

### Changed
- **CRUD API 통합**
  - `src/app/api/customers/route.ts`: POST에 Sheets 동기화 추가
  - `src/app/api/reservations/route.ts`: POST에 Sheets 동기화 추가
  - `src/app/api/reservations/[id]/route.ts`: PUT/DELETE에 Sheets 동기화 추가

- **향상된 사용자 표시**
  - 예약 상태 한글 변환: `PENDING→대기`, `CONFIRMED→확정`, `COMPLETED→완료`, `CANCELLED→취소`
  - 날짜/시간 한국 시간대 적용: `Asia/Seoul`
  - 차량 정보: 모델명 + 번호판 조합 표시

### Fixed
- **API 에러 응답 분리**: `400 (미연결)`, `500 (실패)` 구분
- **Sheets API 실패 격리**: 동기화 실패 시 DB 작업에 영향 없음 (graceful degradation)

### Performance
- **비동기 처리**: 모든 Sheets 동기화는 fire-and-forget 패턴으로 API 응답 시간 영향 최소화 (< 10ms 추가)
- **자동 재시도**: ensureSheets() 통해 시트 미존재 시 자동 생성

### Quality Metrics
- **설계 일치도**: 97% (59/60 items)
- **기능 요구사항**: 6/6 Complete (FR-01~06)
- **비기능 요구사항**: 3/3 Complete
- **TypeScript 에러**: 0

### Documentation
- `docs/01-plan/features/google-sheets-sync.plan.md`: 기획 문서
- `docs/02-design/features/google-sheets-sync.design.md`: 설계 문서
- `docs/03-analysis/google-sheets-sync.analysis.md`: 분석 보고서 (97% match)
- `docs/04-report/features/google-sheets-sync.report.md`: 완성 보고서

---

## 준비 필요 사항

### 환경 설정
1. Google Sheet 생성 후 ID를 `.env.local`에 설정
   ```
   GOOGLE_SHEET_ID="your-sheet-id"
   ```

2. OAuth 재인증
   - 스코프 추가로 인해 사용자가 다시 인증 필요
   - 기존 Calendar 연동 사용자는 자동으로 Sheets 권한 추가

3. Google Sheet 시트 구조 (자동 생성됨)
   - "고객목록" 시트: ID, 이름, 전화번호, 메모, 등록일, 차량수, 예약수
   - "예약목록" 시트: ID, 고객명, 전화번호, 차량, 예약일시, 작업유형, 소요시간, 상태, 작업내용, 메모

### 사용자 공지
- Google Sheets는 **읽기 전용** 권장 (앱이 단방향 동기화만 지원)
- 시트 수정이 필요한 경우 앱에서 수정 후 자동 동기화됨

---

## 향후 개선 사항 (우선순위)

### Short-term (1-2주)
- [ ] 429 Rate Limit 재시도 로직 추가 (Low - 현재 발생 빈도 낮음)
- [ ] 동기화 실패 시 사용자 알림 UI 추가 (toast notification)
- [ ] 로깅 시스템 강화 (동기화 성공/실패 기록)

### Medium-term (1개월)
- [ ] 배치 동기화 최적화 (대량 데이터 처리 시 API 할당량 절감)
- [ ] 설계 문서 업데이트 (구현 내용 반영)

### Long-term
- [ ] Google Sheets ↔ DB 양방향 동기화 (복잡도 높음)
- [ ] 동기화 모니터링 대시보드

---

**더 자세한 내용은 [완성 보고서](features/google-sheets-sync.report.md) 참조**
