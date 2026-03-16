# BIGS MOTORS 오토샵 매니저 - 배포 가이드

> 이 문서를 읽은 AI는 아래 단계를 순서대로 실행하세요.

## 현재 상태 (2026-03-17 기준)

- 프레임워크: Next.js 16.1.6 (App Router)
- ORM: Prisma (PostgreSQL)
- DB: Supabase PostgreSQL (프로젝트ID: vtujrndsbpljhckszued)
- 배포: Vercel (프로젝트명: bigs-motors-manager)
- URL: https://bigs-motors-manager.vercel.app
- GitHub: https://github.com/aijunny0604-alt/auto-shop-manager (public)

### 완료된 작업
- [x] SQLite → Supabase PostgreSQL 전환
- [x] Prisma 마이그레이션 완료 (9개 테이블)
- [x] Vercel 배포 완료
- [x] 사이트명 BIGS MOTORS 오토샵 매니저로 변경
- [x] 도메인 bigs-motors-manager.vercel.app 설정

### 미완료 작업
- [ ] Vercel Ignored Build Step 설정 (아래 참고)
- [ ] Google Calendar 연동 테스트
- [ ] Google 토큰 저장 방식 변경 (파일 → DB)

---

## Vercel 배포 제어 (Ignored Build Step)

### 설정 방법
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
DATABASE_URL="postgresql://postgres.vtujrndsbpljhckszued:[비밀번호]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.vtujrndsbpljhckszued:[비밀번호]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"
GOOGLE_CLIENT_ID="417308976573-uanvnj7nef2abv89a8lf33ou0tdqbdmc.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="[Google Cloud Console에서 확인]"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
```

### Vercel 환경변수 (5개 필요)
| Name | 설명 |
|------|------|
| `DATABASE_URL` | Supabase Transaction pooler (포트 6543) |
| `DIRECT_URL` | Supabase Session pooler (포트 5432) |
| `GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 시크릿 |
| `GOOGLE_REDIRECT_URI` | `https://bigs-motors-manager.vercel.app/api/auth/google/callback` |

---

## Google Calendar 연동

### Google Cloud Console 설정
- 프로젝트: auto (Google Cloud)
- OAuth 클라이언트 ID: 417308976573-uanvnj7nef2abv89a8lf33ou0tdqbdmc.apps.googleusercontent.com
- 승인된 리디렉션 URI:
  - `http://localhost:3000/api/auth/google/callback` (로컬)
  - `https://bigs-motors-manager.vercel.app/api/auth/google/callback` (프로덕션)

### 토큰 저장 방식 변경 (TODO)
현재: `prisma/google-token.json` 파일 저장 → Vercel에서는 파일 저장 불가
변경 필요: Supabase DB 테이블에 토큰 저장으로 변경

---

## Prisma 스키마 (9개 모델)

| 모델 | 설명 |
|------|------|
| InventoryItem | 재고 |
| StockLog | 입출고 이력 |
| Customer | 고객 |
| Vehicle | 차량 |
| ServiceRecord | 정비 기록 |
| ServicePartUsed | 정비 부품 사용 |
| ImportHistory | 임포트 이력 |
| Reservation | 예약 |

### 관계
- Customer → Vehicle (1:N)
- Customer → Reservation (1:N)
- Vehicle → ServiceRecord (1:N)
- Vehicle → Reservation (1:N)
- ServiceRecord → ServicePartUsed (1:N)
- InventoryItem → StockLog (1:N)
- InventoryItem → ServicePartUsed (1:N)

---

## 무료 플랜 한도

| 서비스 | 무료 제공 | 비고 |
|--------|-----------|------|
| Vercel | 빌드 6,000분/월, 100GB 대역폭 | [deploy] 키워드로 빌드 절약 |
| Supabase | DB 500MB, 5GB/월 대역폭 | 7일 미사용 시 일시정지 |
| Google API | 무료 (일일 쿼터) | 소규모 사용 여유 |

---

## 타인에게 프로젝트 전달 시

1. 상대방 Vercel 가입 (GitHub 계정)
2. 내 GitHub 저장소를 상대방 Vercel에서 Import
3. 환경변수 5개 설정
4. 내가 코드 수정 후 `[deploy]` 커밋 → 상대방 사이트 자동 업데이트
