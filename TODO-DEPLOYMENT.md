# Auto Shop Manager - Vercel 배포 TODO

## 현재 상태
- [x] GitHub 저장소 push 완료
- [x] Google OAuth 설정 완료 (테스트 사용자: aijunny0604@gmail.com)
- [x] 로컬 개발 환경 정상 작동 (localhost:3000)
- [ ] 클라우드 DB 마이그레이션
- [ ] Vercel 배포

---

## 1단계: Supabase 설정 (DB 마이그레이션)

### 1-1. Supabase 프로젝트 생성
- [ ] https://supabase.com 가입/로그인
- [ ] New Project 생성 (Region: Northeast Asia - ap-northeast-1)
- [ ] Project URL, anon key, service_role key 메모

### 1-2. 테이블 생성 (현재 Prisma 스키마 기준)
- [ ] customers 테이블
- [ ] vehicles 테이블
- [ ] reservations 테이블
- [ ] inventory 테이블
- [ ] stock_history 테이블

### 1-3. 코드 수정
- [ ] `prisma` 제거 → `@supabase/supabase-js` 설치
- [ ] `src/lib/supabase.ts` 클라이언트 생성
- [ ] 모든 API 라우트 Prisma → Supabase 쿼리로 변경
  - [ ] `/api/customers/*`
  - [ ] `/api/reservations/*`
  - [ ] `/api/inventory/*`
  - [ ] `/api/dashboard/stats`
- [ ] `.env.local`에 Supabase 환경변수 추가

---

## 2단계: Vercel 배포

### 2-1. Vercel 프로젝트 연결
- [ ] https://vercel.com 가입 (GitHub 계정 연동)
- [ ] "Import Project" → GitHub 저장소 선택
- [ ] Framework: Next.js 자동 감지

### 2-2. 환경변수 설정 (Vercel Dashboard > Settings > Environment Variables)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = Supabase 프로젝트 URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Supabase anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = Supabase service role key
- [ ] `GOOGLE_CLIENT_ID` = 현재 .env.local 값 그대로
- [ ] `GOOGLE_CLIENT_SECRET` = 현재 .env.local 값 그대로
- [ ] `GOOGLE_REDIRECT_URI` = `https://your-app.vercel.app/api/auth/google/callback`
- [ ] `GOOGLE_SHEET_ID` = Google Sheets ID (선택)

### 2-3. Google Cloud Console 수정
- [ ] OAuth 승인된 리디렉션 URI에 Vercel 도메인 추가
  - `https://your-app.vercel.app/api/auth/google/callback`
- [ ] 테스트 사용자에 실사용 이메일 추가 (필요시)

### 2-4. 배포 확인
- [ ] Vercel 자동 빌드 성공 확인
- [ ] 사이트 접속 확인 (`https://your-app.vercel.app`)
- [ ] Google Calendar 연동 테스트
- [ ] 예약 CRUD 테스트
- [ ] 고객 등록/검색 테스트
- [ ] 재고 관리 테스트

---

## 3단계: Google OAuth 토큰 저장 방식 변경

현재 토큰이 `prisma/google-token.json` 파일에 저장됨 → Vercel에서는 파일 저장 불가

- [ ] 토큰 저장소를 Supabase `google_tokens` 테이블로 변경
- [ ] `src/lib/google-calendar.ts` 수정 (파일 → DB 저장/로드)
- [ ] refresh token 자동 갱신 로직 확인

---

## 참고사항

### 예상 소요 시간
- Supabase 설정 + DB 마이그레이션: 1~2시간
- Vercel 배포 + 환경변수: 30분
- Google OAuth 수정 + 토큰 저장 변경: 1시간
- 테스트: 30분

### 무료 플랜 한도
| 서비스 | 무료 제공 | 비고 |
|--------|-----------|------|
| Vercel | 월 100GB 대역폭 | 개인 사용 충분 |
| Supabase | DB 500MB, 월 5만 API | 1주 비활성 시 일시정지 |
| Google API | 무료 (일일 쿼터) | 소규모 사용 여유 |

### 현재 로컬 데이터
- SQLite DB 경로: `prisma/dev.db`
- 기존 고객/예약 데이터는 Supabase로 수동 이관 필요 (또는 새로 입력)
