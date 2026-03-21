# BIGS MOTORS 오토샵 매니저 - 배포/개발 이력

## 완료된 작업

### 1단계: Supabase 설정 (DB 마이그레이션) ✅
- [x] Supabase 프로젝트 생성
- [x] Prisma provider: SQLite → PostgreSQL 변경
- [x] Session Pooler 연결 (IPv4 호환)
- [x] prisma migrate dev 실행 (10개 테이블 생성)
- [x] .env.local / .env 환경변수 설정

### 2단계: Vercel 배포 ✅
- [x] Vercel 프로젝트 생성 (bigs-motors-manager)
- [x] GitHub 저장소 연결 (auto-shop-manager)
- [x] 환경변수 5개 설정
- [x] [deploy] 키워드 배포 제어 설정
- [x] 배포 성공 확인

### 3단계: 사이트명 변경 ✅
- [x] "BIGS MOTORS 오토샵 매니저" 적용

### 4단계: Google Calendar 연동 ✅
- [x] OAuth 설정 + 토큰 DB 저장 방식 적용
- [x] 설정 페이지에서 계정 변경/해제 기능 추가

### 5단계: 성능 최적화 ✅
- [x] DB 인덱스 7개 추가
- [x] 대시보드 API: DB 레벨 필터링 + 병렬 쿼리
- [x] Prisma 싱글턴 사용

### 6단계: Glassmorphism 다크 테마 ✅
- [x] 프리미엄 다크 테마 적용

### 7단계: 견적서 시스템 ✅
- [x] 견적서 CRUD (생성/조회/수정/삭제)
- [x] 견적번호 자동 생성 (EST-YYYYMMDD-NNN)
- [x] 공임/부품 항목 관리, 할인, 인쇄용 페이지
- [x] 신규 고객 인라인 등록 지원

### 8단계: 매출 관리 ✅ (2026-03-21)
- [x] 매출 API (기간별/유형별 집계)
- [x] 매출 대시보드 (요약 카드 4개 + CSS 차트 + 유형별 테이블)
- [x] 기간 필터 (오늘/이번주/이번달/3개월/직접입력)

### 9단계: 검색/필터 강화 ✅ (2026-03-21)
- [x] 예약: 날짜 범위 + 상태 + 서비스 유형 필터
- [x] 견적서: 날짜 범위 필터
- [x] 재고: 카테고리 + 재고 부족만 체크박스
- [x] 고객: 이름 + 전화번호 통합 OR 검색

### 10단계: 데이터 백업/복원 ✅ (2026-03-21)
- [x] JSON 내보내기 (전체 10개 테이블)
- [x] JSON 복원 (트랜잭션 기반, 기존 데이터 삭제 후 삽입)
- [x] 설정/백업 페이지 UI

### 11단계: UX 개선 ✅ (2026-03-21)
- [x] 카드 클릭 → 상세 페이지 이동 (견적서, 예약, 고객, 재고)
- [x] 호버 애니메이션 (translateY + 그림자 강화)
- [x] 전체 cursor: pointer / cursor: default 통일
- [x] 텍스트 커서 깜빡임 제거
- [x] 사이드바에 매출 관리, 설정/백업 메뉴 추가

### 12단계: 서울 리전 마이그레이션 ✅ (2026-03-21)
- [x] Supabase: 호주(ap-southeast-2) → 서울(ap-northeast-2) 이전
- [x] 데이터 백업 → 복원 완료
- [x] API 응답 속도: 평균 0.83s → 0.23s (4배 향상)
- [x] Vercel 함수 리전: 미국 → 서울(icn1)
- [x] vercel.json regions 설정

### 13단계: 로그인 + Google 계정 관리 ✅ (2026-03-21)
- [x] 비밀번호 로그인 (환경변수 ADMIN_PASSWORD 기반)
- [x] 세션 쿠키 30일 유지
- [x] 비로그인 시 로그인 페이지 리다이렉트
- [x] 설정 페이지에 Google 계정 변경/해제 기능
- [x] 설정 페이지에 로그아웃 버튼

### 14단계: 고객 검색 강화 + 견적서 복사 ✅ (2026-03-21)
- [x] 고객 검색: 이름, 전화번호, 차량번호, 차종 통합 OR 검색
- [x] 고객 카드에 차량 정보 표시
- [x] 실시간 검색 (300ms 디바운스)
- [x] 견적서 카톡/문자 텍스트 복사 기능

### 15단계: 차대번호(VIN) + UI/UX 개선 ✅ (2026-03-21~22)
- [x] Vehicle 모델에 vin(차대번호) 필드 추가
- [x] 고객 등록 시 차대번호 입력란 추가
- [x] 폼 페이지: max-w-2xl 중앙 정렬 (입력란 적정 너비)
- [x] 상세/리스트 페이지: 전체 너비 유지
- [x] 재고/고객 상세 페이지 레이아웃 정리 + 모바일 반응형
- [x] 전역 텍스트 선택 방지 (user-select: none)
- [x] 전역 커서 통일 (default/pointer/text)
- [x] 호버 애니메이션 (translateY + 그림자)
- [x] 카드 클릭 → 상세 페이지 이동

---

## Supabase 정보
- 프로젝트: BIGS MOTORS AUTO Manager
- 프로젝트ID: hhddzuyfoalrgbwokbfs
- Region: ap-northeast-2 (서울)

## Google OAuth 정보
- Google Cloud 프로젝트: auto
- 테스트 사용자: aijunny0604@gmail.com
- 설정 페이지에서 계정 변경/해제 가능
