# Sidedock

> **한국의 AI·사이드 프로젝트 쇼케이스 플랫폼**  
> "Build Something. Launch Here."

한국 개발자/메이커가 만든 AI 툴, SaaS, 사이드 프로젝트를 등록하고 발견하는 플랫폼입니다.  
Product Hunt의 한국판이라고 생각하면 됩니다.

---

## 목차

1. [기술 스택](#기술-스택)
2. [프로젝트 구조](#프로젝트-구조)
3. [개발환경 셋업](#개발환경-셋업)
4. [환경 변수](#환경-변수)
5. [Supabase 설정](#supabase-설정)
6. [개발 서버 실행](#개발-서버-실행)
7. [주요 페이지 및 라우팅](#주요-페이지-및-라우팅)
8. [DB 스키마 개요](#db-스키마-개요)
9. [배포](#배포)

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 16.2.6 (App Router, TypeScript) |
| 스타일링 | Tailwind CSS v4 |
| 백엔드/DB | Supabase (PostgreSQL, Auth, Storage, RLS) |
| 번들러 | Turbopack |
| 패키지 매니저 | npm |
| 배포 | Vercel (예정) |

---

## 프로젝트 구조

```
src/
├── app/                        # Next.js App Router 페이지
│   ├── layout.tsx              # 루트 레이아웃 (Navbar, Footer)
│   ├── page.tsx                # 홈페이지 (오늘의 런칭)
│   ├── auth/
│   │   ├── callback/route.ts   # OAuth 콜백 핸들러 (온보딩 메타데이터 설정)
│   │   └── error/page.tsx      # 인증 오류 페이지
│   ├── login/page.tsx          # 소셜 로그인 (Google / Kakao)
│   ├── onboarding/page.tsx     # 신규 가입 프로필 설정 (완료 전 이탈 방지)
│   ├── submit/page.tsx         # 제품 등록 폼
│   ├── products/
│   │   ├── page.tsx            # 전체 제품 목록 + 카테고리 필터
│   │   └── [id]/page.tsx       # 제품 상세 (업보트, 댓글, 리뷰)
│   ├── hot/page.tsx            # 인기 제품 랭킹
│   ├── launches/page.tsx       # 런칭 피드
│   ├── devlog/
│   │   ├── page.tsx            # 개발 로그 커뮤니티
│   │   ├── new/page.tsx        # 개발 로그 작성
│   │   └── [id]/
│   │       ├── page.tsx        # 개발 로그 상세
│   │       └── edit/page.tsx   # 개발 로그 수정 (작성자 전용)
│   ├── profile/[username]/page.tsx  # 메이커 프로필
│   ├── settings/page.tsx       # 계정 설정
│   ├── admin/
│   │   ├── moderation/page.tsx # 제품 심사 (관리자 전용)
│   │   └── upload/
│   │       ├── page.tsx        # Hot Product 등록 (관리자 전용)
│   │       └── [id]/page.tsx   # Hot Product 수정 (관리자 전용)
│   ├── terms/page.tsx          # 이용약관
│   └── privacy/page.tsx        # 개인정보처리방침
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx          # 서버 컴포넌트 네비게이션 바
│   │   ├── NavbarClient.tsx    # 클라이언트 컴포넌트 (로그인/로그아웃)
│   │   └── NavbarTabs.tsx      # 탭 네비게이션
│   ├── home/
│   │   ├── FeaturedHeroCard.tsx
│   │   ├── ExpandableProductList.tsx
│   │   └── WelcomeBanner.tsx
│   ├── product/
│   │   ├── ProductCard.tsx     # 제품 카드 (목록 아이템)
│   │   ├── ProductTabs.tsx     # 제품 상세 탭 (큐레이션 제품은 팀/추천 탭 숨김)
│   │   ├── CommentForm.tsx
│   │   ├── MediaGallery.tsx
│   │   └── UpvoteButton.tsx
│   ├── profile/
│   │   ├── ProfileProducts.tsx
│   │   └── ProfileTabNav.tsx
│   └── ui/
│       ├── SearchBar.tsx
│       └── DragScroll.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── server.ts           # 서버사이드 Supabase 클라이언트 (SSR)
│   │   └── client.ts           # 브라우저 Supabase 클라이언트
│   ├── admin.ts                # 관리자 권한 확인 유틸
│   └── actions/                # Server Actions
│       ├── product.ts          # 제품 CRUD (createCuratedProduct, updateCuratedProduct 포함)
│       ├── comment.ts
│       ├── upvote.ts
│       ├── review.ts
│       ├── devlog.ts
│       ├── onboarding.ts       # 온보딩 완료 처리 (JWT 메타데이터 업데이트)
│       └── profile.ts
│
├── types/
│   └── index.ts                # TypeScript 공통 타입 정의
│
├── hooks/                      # 커스텀 훅
└── proxy.ts                    # 세션 갱신 + 온보딩 이탈 방지 미들웨어 (Next.js 16)
```

---

## 개발환경 셋업

### 사전 요구사항

- **Node.js** 20.x 이상 ([다운로드](https://nodejs.org/))
- **npm** 10.x 이상 (Node.js와 함께 설치됨)
- **Git**

---

### 🔧 프로젝트 최초 생성 (이미 클론한 경우 건너뜀)

> 이 섹션은 **처음부터 프로젝트를 새로 만들 때**의 기록입니다.  
> 이미 레포를 클론했다면 아래 "기존 레포 클론" 섹션으로 넘어가세요.

#### 1. Next.js 프로젝트 생성

```bash
npx create-next-app@latest sidedock
```

`create-next-app` 질문 응답:

| 질문 | 선택 |
|------|------|
| TypeScript? | **Yes** |
| ESLint? | Yes |
| Tailwind CSS? | **Yes** |
| `src/` directory? | **Yes** |
| App Router? | **Yes** |
| Turbopack? | **Yes** |
| Import alias? | No (기본 `@/*`) |

#### 2. Supabase 패키지 설치

```bash
cd sidedock
npm install @supabase/supabase-js @supabase/ssr
```

- `@supabase/supabase-js` — Supabase 기본 클라이언트
- `@supabase/ssr` — Next.js SSR 환경에서 쿠키 기반 세션 처리용

#### 3. 폴더 구조 생성

```bash
# 컴포넌트 디렉토리
mkdir -p src/components/layout
mkdir -p src/components/product
mkdir -p src/components/ui

# 라이브러리 및 기타
mkdir -p src/lib/supabase
mkdir -p src/types
mkdir -p src/hooks

# Supabase 스키마 보관용
mkdir supabase
```

#### 4. middleware.ts → proxy.ts (Next.js 16 변경사항)

Next.js 16부터 `middleware.ts`의 exported function 이름이 `middleware` → `proxy`로 변경되었습니다.  
파일명도 `src/proxy.ts`로 사용합니다.

---

### 📥 기존 레포 클론 (팀원 셋업)

#### 1. 레포 클론

```bash
git clone <레포 주소>
cd sidedock
```

#### 2. 의존성 설치

```bash
npm install
```

#### 3. 환경 변수 설정

아래 내용으로 프로젝트 루트에 `.env.local` 파일을 생성합니다.  
**실제 값은 팀 리더에게 따로 받으세요** (절대 Git에 커밋하지 마세요).

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://<프로젝트ID>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

---

## 환경 변수

| 변수명 | 설명 | 환경 | 필수 |
|--------|------|------|----- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | 공통 | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon(공개) 키 — RLS로 보호됨 | 공통 | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role 키 — **서버 전용**, RLS 우회 | 서버 only | ✅ |
| `NEXT_PUBLIC_APP_URL` | 앱 베이스 URL (개발: `http://localhost:3000`, 운영: `https://sidedock.io`) | 공통 | ✅ |
| `UPLOAD_DIR` | 파일 업로드 로컬 저장 경로 (운영은 Supabase Storage로 교체 필요) | 개발 only | - |

> - `.env.local` 은 `.gitignore`에 포함되어 있어 Git에 올라가지 않습니다.
> - `.env.example` 을 참고해 값을 채우세요 (이 파일은 Git에 커밋됩니다).
> - `NEXT_PUBLIC_` 접두사가 없는 키는 브라우저에 절대 노출되지 않습니다.
> - `SUPABASE_SERVICE_ROLE_KEY` 는 RLS를 우회하므로 서버 코드(`app/api/`, `actions/`)에서만 사용하세요.

### 개발 / 운영 환경 분리

| 항목 | 개발 (`.env.local`) | 운영 (Vercel 환경변수) |
|------|---------------------|------------------------|
| Supabase 프로젝트 | 별도 개발용 프로젝트 권장 | 운영 전용 프로젝트 |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://sidedock.io` |
| `UPLOAD_DIR` | `D:\files` (로컬 경로) | 사용 안 함 (Supabase Storage) |
| `NODE_ENV` | `development` (자동) | `production` (자동) |

---

## Supabase 설정

이 프로젝트는 **Supabase Cloud**를 사용합니다 (로컬 Docker 환경 불필요).

### DB 스키마 및 마이그레이션 적용 순서

새 Supabase 프로젝트를 생성했다면 아래 순서대로 SQL을 실행해야 합니다.  
**순서를 지키지 않으면 의존성 오류가 발생합니다.**

> [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 → **SQL Editor** → 각 파일 내용 붙여넣기 → **RUN**

| 순서 | 파일 | 설명 |
|------|------|------|
| 1 | `supabase/schema.sql` | **기본 스키마** — `profiles`, `products`, `upvotes`, `comments`, `saved_products`, `devlog_posts` 테이블 생성. RLS 정책 및 트리거(신규 유저 자동 프로필 생성, 업보트/댓글 카운트 자동 갱신) 포함. |
| 2 | `supabase/migration_v2.sql` | **제품 등록 확장** — `product_category` enum 추가(모바일앱·브라우저확장 등), `products`에 `categories`·`is_open_source`·`repo_url`·`maker_type` 컬럼 추가. `product_links`(플랫폼별 링크), `product_team_members`, `product_shoutouts`, `product_investor_info` 테이블 생성. |
| 3 | `supabase/migration_v3.sql` | **리뷰 시스템** — `reviews` 테이블 생성 (별점 1–5, 10자 이상 본문, 유저당 제품 리뷰 1개 제한). RLS 적용. |
| 4 | `supabase/migration_v4.sql` | **심사 워크플로우 + 알림** — `product_status` enum(`draft` / `pending_review` / `published` / `rejected`) 추가, `products`에 `status`·`rejection_reason` 컬럼 추가. `notifications` 테이블 생성. 관리자 전용 RLS 정책 추가. |
| 5 | `supabase/migration_v5.sql` | **프로필 확장** — `profiles`에 `headline` 컬럼 추가. |
| 6 | `supabase/migration_v6.sql` | **개발 로그 썸네일** — `devlog_posts`에 `thumbnail_url` 컬럼 추가. `devlog_posts` DELETE RLS 정책 추가. |

> **주의**: 이미 운영 중인 DB에 v4를 적용하면 기존 `draft` 상태 제품이 모두 `published`로 백필됩니다 (의도된 동작).

### OAuth 설정 (Google / Kakao 로그인)

1. Supabase Dashboard → **Authentication** → **Providers**
2. **Google** 활성화 후 Google Cloud Console에서 OAuth 2.0 클라이언트 ID 발급
   - 승인된 리디렉션 URI: `https://<프로젝트ID>.supabase.co/auth/v1/callback`
3. 운영 도메인 변경 후 반드시 업데이트:
   - **Site URL**: `https://sidedock.io`
   - **Redirect URLs**: `https://sidedock.io/auth/callback`

---

## 개발 서버 실행

```bash
# 개발 모드 (Turbopack, Hot Reload)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start

# 타입 체크
npx tsc --noEmit
```

---

## 주요 페이지 및 라우팅

| URL | 설명 | 상태 |
|-----|------|------|
| `/` | 홈 (오늘의 런칭, Featured 카드) | ✅ 완료 |
| `/login` | 소셜 로그인 (Google / Kakao) | ✅ 완료 |
| `/onboarding` | 신규 가입 후 프로필 설정 | ✅ 완료 |
| `/submit` | 제품 등록 폼 (로그인 필요) | ✅ 완료 |
| `/products` | 전체 제품 목록 + 카테고리 필터 | ✅ 완료 |
| `/products/[id]` | 제품 상세 (업보트, 댓글, 리뷰) | ✅ 완료 |
| `/hot` | 인기 제품 랭킹 | ✅ 완료 |
| `/launches` | 런칭 피드 | ✅ 완료 |
| `/devlog` | 개발 로그 커뮤니티 | ✅ 완료 |
| `/devlog/new` | 개발 로그 작성 | ✅ 완료 |
| `/devlog/[id]` | 개발 로그 상세 | ✅ 완료 |
| `/devlog/[id]/edit` | 개발 로그 수정 (작성자 전용) | ✅ 완료 |
| `/profile/[username]` | 메이커 프로필 | ✅ 완료 |
| `/settings` | 계정 설정 | ✅ 완료 |
| `/admin/moderation` | 제품 심사 (관리자 전용) | ✅ 완료 |
| `/admin/upload` | Hot Product 등록 (관리자 전용) | ✅ 완료 |
| `/admin/upload/[id]` | Hot Product 수정 (관리자 전용) | ✅ 완료 |
| `/auth/callback` | OAuth 콜백 (수정 금지) | ✅ 완료 |
| `/terms` | 이용약관 | ✅ 완료 |
| `/privacy` | 개인정보처리방침 | ✅ 완료 |

---

## DB 스키마 개요

Supabase(PostgreSQL) 테이블 구조입니다.

```
profiles         ← auth.users에 연결된 사용자 프로필
products         ← 등록된 제품 (FTS 인덱스 포함)
upvotes          ← 제품 업보트 (products.upvote_count 자동 갱신)
comments         ← 제품 댓글 (products.comment_count 자동 갱신)
saved_products   ← 북마크
```

- 모든 테이블에 **RLS(Row Level Security)** 적용됨
- 신규 유저 가입 시 `profiles` 레코드 자동 생성 (트리거)
- `supabase/schema.sql` 에 전체 DDL 있음

---

## 배포

**Vercel** 사용 (Next.js 공식 권장 플랫폼).

### 배포 전 체크리스트

- [ ] `npm run build` 로컬 빌드 성공 확인
- [ ] Vercel 프로젝트에 환경변수 5개 설정 (위 환경 변수 표 참고)
- [ ] 운영용 Supabase 프로젝트에 schema.sql → v2 → v3 → v4 → v5 → v6 순서로 실행 완료
- [ ] Supabase → Authentication → Site URL을 `https://sidedock.io` 로 변경
- [ ] Supabase → Authentication → Redirect URLs에 `https://sidedock.io/auth/callback` 추가
- [x] ~~**파일 업로드 Supabase Storage 전환 완료**~~ (`src/app/api/upload/route.ts` 참고)

### Vercel 배포 명령

```bash
# 로컬에서 프로덕션 빌드 검증 (배포 전 반드시 실행)
npm run build

# GitHub 푸시 → Vercel 자동 배포 (main 브랜치)
git push origin main
```

### 커스텀 도메인 (sidedock.io)

1. Vercel 대시보드 → 프로젝트 → **Settings → Domains** → `sidedock.io` 추가
2. 도메인 구매처 DNS 관리에서 아래 레코드 추가:

| Type | Name | Value |
|------|------|-------|
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

> SSL 인증서는 Vercel이 자동 발급합니다.

---

## 온보딩 플로우

소셜 로그인 신규 가입 시 온보딩 완료를 강제합니다.

1. `/auth/callback` — OAuth 콜백에서 `user_metadata.onboarding_completed = false` 설정 후 `/onboarding` 리디렉트
2. `/onboarding` 완료 시 `onboarding.ts` Server Action이 `onboarding_completed = true` 로 업데이트
3. `proxy.ts` (미들웨어)에서 `onboarding_completed === false` 인 유저가 `/onboarding` 외 보호된 경로 접근 시 `/onboarding` 으로 강제 리디렉트

> 기존에 가입된 유저는 `onboarding_completed` 값이 없으므로 리디렉트되지 않습니다.

---

## 주의사항

- `src/proxy.ts` 는 Next.js 16에서 `middleware.ts` 를 대체합니다. 파일명/함수명을 바꾸지 마세요.
- Supabase 클라이언트는 **서버 컴포넌트**에서 `lib/supabase/server.ts`, **클라이언트 컴포넌트**에서 `lib/supabase/client.ts` 를 사용합니다. 혼용하지 마세요.
- `NEXT_PUBLIC_` 접두사가 없는 환경 변수는 브라우저에 노출되지 않습니다. 민감한 키는 접두사 없이 사용하세요.
