# Vercel + Supabase 배포 가이드 (AI 실행용)

> 이 문서를 읽은 AI는 아래 단계를 순서대로 실행하세요.
> 사용자에게 Supabase DATABASE_URL만 받으면 바로 시작 가능합니다.

## 현재 상태
- 프레임워크: Next.js 16.1.6 (App Router)
- ORM: Prisma (현재 SQLite)
- 로컬 개발 서버: 정상 동작
- GitHub Pages: 정적 배포 완료 (데이터 없음, UI만 확인용)
- GitHub: https://github.com/aijunny0604-alt/auto-shop-manager (public)

## 목표
SQLite → Supabase PostgreSQL 전환 후 Vercel 무료 배포

---

## 사전 준비 (사용자가 해야 할 것)

### 1. Supabase 프로젝트 생성
1. https://supabase.com/dashboard/projects 접속
2. "New Project" 클릭
3. 설정:
   - Name: `auto-shop-manager`
   - Database Password: 기억할 수 있는 비밀번호
   - Region: `Northeast Asia (Tokyo)`
4. "Create new project" 클릭

### 2. DATABASE_URL 확인
1. Settings → Database → Connection string → URI 복사
2. 형식: `postgresql://postgres.[프로젝트ID]:[비밀번호]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`

### 3. Vercel 계정
- https://vercel.com 에서 GitHub 계정으로 로그인

---

## AI 실행 단계

### Step 1: Prisma provider 변경

```prisma
// prisma/schema.prisma
datasource db {
  provider  = "postgresql"          // sqlite → postgresql
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")     // Supabase pooler 대응
}
```

### Step 2: .env 업데이트

```env
# .env.local
DATABASE_URL="postgresql://postgres.[프로젝트ID]:[비밀번호]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[프로젝트ID]:[비밀번호]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

- DATABASE_URL: 포트 6543 (Connection Pooler, pgbouncer=true)
- DIRECT_URL: 포트 5432 (Direct, 마이그레이션용)

### Step 3: 기존 마이그레이션 초기화

```bash
# 기존 SQLite 마이그레이션 삭제
rm -rf prisma/migrations

# PostgreSQL용 새 마이그레이션 생성
npx prisma migrate dev --name init

# 확인
npx prisma studio
```

### Step 4: 로컬 테스트

```bash
npm run dev
# localhost:3000 에서 CRUD 정상 동작 확인
```

### Step 5: Vercel 배포

```bash
# Vercel CLI 설치 (없으면)
npm i -g vercel

# 배포
vercel

# 환경변수 설정 (Vercel 대시보드 또는 CLI)
vercel env add DATABASE_URL
vercel env add DIRECT_URL

# 프로덕션 배포
vercel --prod
```

또는 Vercel 대시보드에서:
1. https://vercel.com/new → Import Git Repository → auto-shop-manager 선택
2. Environment Variables에 DATABASE_URL, DIRECT_URL 추가
3. Deploy

### Step 6: Vercel 자동 배포 설정

Vercel 대시보드 → Settings → Git:
- Production Branch: `master`
- Auto Deploy: 필요시 OFF (빌드 횟수 절약)

### Step 7: 배포 확인

```bash
# 배포 URL 확인
vercel ls

# 브라우저에서 확인
# https://auto-shop-manager-[hash].vercel.app
```

---

## 주의사항

### SQLite → PostgreSQL 변환 시 확인 포인트
- `@default(cuid())` → PostgreSQL에서도 정상 동작
- `DateTime` → PostgreSQL `timestamp` 자동 매핑
- `Int` → PostgreSQL `integer` 자동 매핑
- `onDelete: Cascade` → PostgreSQL에서 정상 동작
- 기존 로컬 SQLite 데이터는 마이그레이션 안 됨 (새로 시작)

### Vercel 무료 제한
- 빌드: 6,000분/월
- 배포: 100회/일
- 서버리스 함수: 100GB-Hrs/월
- 자동 배포 OFF 추천 (빌드 횟수 절약)

### Supabase 무료 제한
- DB: 500MB
- 대역폭: 5GB/월
- 7일 미사용 시 프로젝트 일시 중지 (재시작 가능)

---

## 현재 Prisma 스키마 (참고)

모델 9개:
- InventoryItem (재고)
- StockLog (입출고 이력)
- Customer (고객)
- Vehicle (차량)
- ServiceRecord (정비 기록)
- ServicePartUsed (정비 부품 사용)
- ImportHistory (임포트 이력)
- Reservation (예약)

관계:
- Customer → Vehicle (1:N)
- Customer → Reservation (1:N)
- Vehicle → ServiceRecord (1:N)
- Vehicle → Reservation (1:N)
- ServiceRecord → ServicePartUsed (1:N)
- InventoryItem → StockLog (1:N)
- InventoryItem → ServicePartUsed (1:N)

---

## Google Calendar 연동 (선택)

Vercel 환경변수에 추가:
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://[vercel-url]/api/auth/google/callback
```
