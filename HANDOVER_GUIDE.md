# BIGS MOTORS 프로그램 인수인계 가이드

## 개요

개발자(나)는 코드 관리/업데이트만 담당하고, 고객(빅스모터스) 데이터에는 접근하지 못하도록 계정을 분리하는 구조.

---

## 계정 분리 구조

| 항목 | 소유자 | 역할 |
|------|--------|------|
| GitHub | 개발자 | 코드 관리, 업데이트, 패치 |
| Supabase | 빅스모터스 | 데이터 소유 (고객, 예약, 견적 등) |
| Vercel | 빅스모터스 | 배포 + 환경변수 관리 (DB 비밀번호) |
| Google Cloud | 빅스모터스 | Calendar/Sheets API 키 소유 |

### 데이터 흐름

```
[개발자] GitHub push (코드만)
         ↓ 자동 배포
[빅스모터스] Vercel ──→ [빅스모터스] Supabase DB (서울)
```

- 개발자: 코드만 관리. DB URL/비밀번호를 모르므로 데이터 접근 불가
- 빅스모터스: 데이터 소유. 코드는 안 건드려도 됨

---

## 세팅 순서

### 1단계: 빅스모터스 Supabase 계정 생성

1. https://supabase.com 에서 빅스모터스 이메일로 회원가입
2. New Project 생성
   - Organization: 새로 만들기
   - Project name: `bigs-motors` (자유)
   - Database Password: 빅스모터스가 직접 설정 (개발자에게 알려주지 않음)
   - Region: **Northeast Asia (Seoul)** 필수
3. 프로젝트 생성 완료 후 Connection string 복사해둠
   - Settings → Database → Connect 버튼 → URI 탭
   - Transaction pooler (포트 6543) → DATABASE_URL용
   - Session pooler (포트 5432) → DIRECT_URL용

### 2단계: 빅스모터스 Vercel 계정 생성

1. https://vercel.com 에서 빅스모터스 이메일로 회원가입
2. "Add New Project" → "Import Git Repository"
3. GitHub 연결 → `aijunny0604-alt/auto-shop-manager` 레포 선택
   - 개발자가 미리 빅스모터스 GitHub 계정을 collaborator로 추가하거나
   - 레포를 빅스모터스 계정으로 fork
4. Framework Preset: Next.js (자동 감지)
5. Environment Variables 입력 (빅스모터스가 직접):

```
DATABASE_URL = postgresql://postgres.{project-id}:{비밀번호}@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL = postgresql://postgres.{project-id}:{비밀번호}@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
GOOGLE_CLIENT_ID = (빅스모터스 Google Cloud에서 발급)
GOOGLE_CLIENT_SECRET = (빅스모터스 Google Cloud에서 발급)
GOOGLE_REDIRECT_URI = https://{빅스모터스-vercel-도메인}/api/auth/google/callback
```

6. Deploy 클릭

### 3단계: DB 스키마 초기화

빅스모터스 Vercel 배포가 완료되면, 개발자가 스키마만 생성해줘야 함.
빅스모터스에게 Supabase Connection string(DIRECT_URL)을 임시로 받아서:

```bash
# .env에 빅스모터스 DIRECT_URL 임시 설정
npx prisma db push

# 완료 후 .env에서 빅스모터스 URL 삭제
```

또는 빅스모터스가 직접 실행:

```bash
git clone {레포 URL}
npm install
# .env에 본인 DB URL 입력
npx prisma db push
```

### 4단계: Google API 설정 (빅스모터스)

1. https://console.cloud.google.com 에서 빅스모터스 계정으로 프로젝트 생성
2. Google Calendar API 활성화
3. Google Sheets API 활성화
4. OAuth 동의 화면 설정
   - 사용자 유형: 외부
   - 앱 이름: BIGS MOTORS 오토샵 매니저
   - 테스트 사용자에 빅스모터스 이메일 추가
5. 사용자 인증 정보 → OAuth 2.0 클라이언트 ID 생성
   - 유형: 웹 애플리케이션
   - 승인된 리디렉션 URI: `https://{vercel-도메인}/api/auth/google/callback`
6. Client ID, Client Secret을 Vercel 환경변수에 입력

### 5단계: 커스텀 도메인 (선택)

- Vercel → Settings → Domains → 빅스모터스 도메인 추가
- 예: `manage.bigsmotors.com`
- DNS 설정은 빅스모터스 도메인 관리자에서 CNAME 추가

---

## 운영 방식

### 업데이트/패치 (개발자)
```bash
# 코드 수정 후
git add . && git commit -m "fix: 버그 수정 [deploy]"
git push origin master
# → 빅스모터스 Vercel에 자동 배포
```

### 데이터 백업 (빅스모터스)
- 설정/백업 페이지 → "데이터 백업" 클릭 → JSON 다운로드
- 정기적으로 백업 권장 (주 1회)

### Google 계정 변경 (빅스모터스)
- 설정/백업 페이지 → "다른 계정으로 변경" 또는 "연동 해제"

### 문제 발생 시
- 빅스모터스: 증상 설명 (스크린샷 등)
- 개발자: 코드 수정 → push → 자동 배포

---

## 보안 체크리스트

- [ ] Supabase 계정: 빅스모터스 소유 확인
- [ ] Vercel 계정: 빅스모터스 소유 확인
- [ ] 환경변수: 빅스모터스가 직접 입력 확인
- [ ] DB 비밀번호: 개발자가 모름 확인
- [ ] Google API 키: 빅스모터스 계정에서 발급 확인
- [ ] 개발자 .env에 빅스모터스 DB URL 없음 확인

---

## 비용 (빅스모터스 부담)

| 서비스 | 무료 플랜 | 유료 시 |
|--------|----------|--------|
| Supabase | 500MB DB, 무료 | Pro $25/월 |
| Vercel | 월 100GB 트래픽, 무료 | Pro $20/월 |
| Google API | 무료 (일일 할당량 내) | 무료 |
| 도메인 | Vercel 기본 제공 | 커스텀 도메인 연 1~2만원 |

소규모 정비소 기준 **무료 플랜으로 충분**.

---

## 현재 테스트 환경 (인수인계 전)

| 항목 | 현재 상태 |
|------|----------|
| GitHub | aijunny0604-alt 계정 |
| Supabase | 개발자 계정 (서울 리전) |
| Vercel | 개발자 계정 |
| URL | https://bigs-motors-manager.vercel.app |

인수인계 시 위 "세팅 순서"대로 빅스모터스 계정으로 전환.
