# 무한 소녀 - 기술 스택 결정 문서

작성일: 2026-02-25

---

## 1. 요구사항 요약

| 항목 | 내용 |
|------|------|
| 게임 특성 | 단일 화면, 페이지 전환 없음, 앱 같은 UX |
| 핵심 기능 | 요소 드래그&드랍 조합, 이미지 생성 대기, 컬렉션 관리 |
| 데이터 규모 | 100만+ 조합 데이터, 빠른 lookup 필요 |
| 이미지 생성 | 별도 백엔드 (Replicate API / RunningHub.ai) |
| 배포 | Cloudflare Pages |
| DB | Supabase (PostgreSQL) |
| 개발자 경험 | React, Next.js, FastAPI 경험 있음 |

---

## 2. 검토한 옵션들

### Option A: Next.js (App Router) + Cloudflare Pages
### Option B: React SPA (Vite) + Hono (Cloudflare Workers)
### Option C: Remix + Cloudflare Pages

---

## 3. 최종 결론

**✅ 추천: Next.js (App Router) + Cloudflare Pages**

`@cloudflare/next-on-pages` 어댑터를 사용해서 배포

---

## 4. 선택 근거

### "페이지 개념이 없는 앱"에 대한 오해 해소

Next.js에서 "SPA처럼 보이는 앱"은 전혀 문제 없다. App Router의 구조는 다음과 같이 단일 페이지로 운영 가능하다:

```
app/
  layout.tsx       ← 전체 앱 레이아웃 (한 번만 렌더)
  page.tsx         ← 게임 메인 화면 (이게 전부)
  api/
    combine/
      route.ts     ← 조합 API
    elements/
      route.ts     ← 요소 목록 API
```

URL은 항상 `/`이고, 모든 인터랙션은 클라이언트 상태에서 처리된다. `'use client'` 컴포넌트가 게임 로직 전체를 담당한다.

### Next.js를 버리지 않아야 하는 이유

1. **Colocation**: 프론트엔드와 API가 같은 repo, 같은 타입을 공유
2. **Server Components**: 초기 요소 목록을 서버에서 가져와 첫 렌더 속도 향상
3. **Route Handlers on Edge**: Cloudflare Workers와 동일한 V8 Isolate 위에서 실행
4. **Ecosystem**: dnd-kit, Framer Motion, shadcn/ui 등 풍부한 UI 라이브러리 활용 가능

### Option B (Vite + Hono)를 선택하지 않은 이유

Hono는 Cloudflare Workers에서 매우 좋지만:

- **monorepo 설정이 필수**: `packages/frontend`, `packages/api` 로 분리해야 하고, turborepo 등 추가 설정이 필요함
- **타입 공유가 번거로움**: Hono의 RPC 타입 공유는 가능하지만 Next.js만큼 자연스럽지 않음
- **"간단하게 만드는 걸 선호"** 조건에 어긋남

---

## 5. Next.js + Cloudflare Pages 상세 아키텍처

### 5.1 전체 구조

```
[Browser]
    │
    │ HTTP/WebSocket
    ▼
[Cloudflare Pages]
  ┌─────────────────────────────────┐
  │  Static Assets (React bundles)  │ ← CDN 캐싱
  ├─────────────────────────────────┤
  │  Cloudflare Functions (Workers) │ ← Next.js API Routes
  │  - /api/combine                 │
  │  - /api/elements                │
  └─────────────────────────────────┘
         │              │
         │              │ Supabase Realtime (WebSocket)
         ▼              ▼
    [Supabase]     [Supabase Realtime]
    PostgreSQL      조합 완료 이벤트
         │
         │ (별도 백엔드에서 호출)
         ▼
  [Image Gen Backend]
  Replicate API / RunningHub.ai
```

### 5.2 Edge Runtime 제약사항 및 대응

`@cloudflare/next-on-pages`는 Node.js 런타임이 아닌 **V8 Isolate** 위에서 실행된다. 주요 제약:

| 제약 | 영향 | 대응 |
|------|------|------|
| `fs` 모듈 사용 불가 | 파일 읽기/쓰기 불가 | 문제 없음 (파일 I/O 없음) |
| `crypto.randomUUID()` | Web Crypto API로 대체 | 자동 대응 |
| 일부 npm 패키지 | Node.js 전용 패키지 불가 | 대부분 문제 없음 |
| **Supabase** | `@supabase/supabase-js` v2 | Edge Runtime 완전 지원 |

모든 `route.ts`에 다음을 명시적으로 선언해야 한다:

```typescript
export const runtime = 'edge';
```

### 5.3 캐시 전략 - Redis 대신 Cloudflare KV

기획서에서 Redis를 언급했는데, Cloudflare Pages 환경에서는 **Cloudflare KV**가 더 적합하다:

| 항목 | Redis (별도 서비스) | Cloudflare KV |
|------|---------------------|---------------|
| 비용 | 별도 요금 | Workers 요금에 포함 |
| Latency | 네트워크 왕복 필요 | Edge 로컬 (~1ms) |
| 설정 | Upstash 등 별도 설치 | Pages 대시보드에서 바인딩 |
| 읽기 성능 | 빠름 | 매우 빠름 (CDN 수준) |
| 쓰기 일관성 | 강함 | Eventual Consistency |

KV는 eventually consistent이므로, 방금 생성된 조합이 캐시에 없을 수 있지만 DB 폴백으로 해결된다:

```typescript
// /api/combine/route.ts
export const runtime = 'edge';

export async function POST(request: Request) {
  const { elementAId, elementBId } = await request.json();

  // 항상 작은 ID가 앞에 오도록 정렬
  const [aId, bId] = [elementAId, elementBId].sort();
  const cacheKey = `combo:${aId}:${bId}`;

  // 1. KV 캐시 확인
  const cached = await env.COMBO_CACHE.get(cacheKey);
  if (cached) {
    return Response.json(JSON.parse(cached));
  }

  // 2. Supabase DB 조회
  const { data: existing } = await supabase
    .from('combinations')
    .select('result_element_id, elements!result_element_id(*)')
    .eq('element_a_id', aId)
    .eq('element_b_id', bId)
    .single();

  if (existing) {
    // KV에 저장 (TTL 24시간)
    await env.COMBO_CACHE.put(cacheKey, JSON.stringify(existing), {
      expirationTtl: 86400
    });
    return Response.json(existing);
  }

  // 3. 신규 조합 → 생성 큐 진입
  const { data: newCombo } = await supabase
    .from('combinations')
    .insert({ element_a_id: aId, element_b_id: bId, status: 'pending' })
    .select()
    .single();

  return Response.json({ status: 'pending', combinationId: newCombo.id });
}
```

---

## 6. 이미지 생성 대기 패턴

이미지 생성이 비동기(Replicate: 10초~수십 초)이므로, UI에서 "생성 중" 상태를 실시간으로 보여줘야 한다.

### 옵션 비교

| 방식 | 구현 난이도 | 실시간성 | 적합성 |
|------|------------|---------|--------|
| Polling (2초마다 API 호출) | 쉬움 | 낮음 | 보통 |
| **Supabase Realtime** | 중간 | 높음 | ✅ 최적 |
| SSE (Server-Sent Events) | 중간 | 높음 | 가능 |
| WebSocket (직접 구현) | 어려움 | 높음 | 오버엔지니어링 |

### 추천: Supabase Realtime

이미 Supabase를 쓰고 있으므로 추가 인프라 없이 실시간 업데이트가 가능하다:

```typescript
// 클라이언트에서 특정 조합 완료를 구독
const channel = supabase
  .channel('combination-status')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'combinations',
      filter: `id=eq.${combinationId}`,
    },
    (payload) => {
      if (payload.new.status === 'done') {
        // 새 소녀 이미지 표시!
        onCombinationComplete(payload.new);
        channel.unsubscribe();
      }
    }
  )
  .subscribe();
```

---

## 7. 프론트엔드 상태 관리

게임 상태는 복잡하지 않지만 다음 데이터를 관리해야 한다:

- 보유 요소 목록 (unlocked elements)
- 조합 중인 요소 쌍
- 생성 중인 조합들의 상태
- 드래그 중인 요소

### 추천: Zustand

Redux보다 보일러플레이트가 적고, React Context보다 성능이 좋다:

```typescript
// store/gameStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GameStore {
  unlockedElements: Element[];
  pendingCombinations: Map<string, 'pending' | 'generating'>;

  unlockElement: (element: Element) => void;
  addPendingCombination: (id: string) => void;
  completeCombination: (id: string, result: Element) => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      unlockedElements: INITIAL_ELEMENTS,
      pendingCombinations: new Map(),

      unlockElement: (element) =>
        set((state) => ({
          unlockedElements: [...state.unlockedElements, element],
        })),
      // ...
    }),
    { name: 'infinite-girl-storage' } // localStorage에 자동 저장
  )
);
```

`persist` 미들웨어로 localStorage에 자동 저장 → 새로고침해도 진행 상황 유지.

---

## 8. 드래그 앤 드롭

InfiniteCraft의 핵심 UX. 추천 라이브러리: **dnd-kit**

- `@dnd-kit/core`: 기본 DnD
- `@dnd-kit/sortable`: 요소 재배치
- 터치 지원 내장 (모바일도 동작)
- React 18 Concurrent Mode 완전 지원

```typescript
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';

function CombineZone() {
  const { setNodeRef, isOver } = useDroppable({ id: 'combine-zone' });

  return (
    <div
      ref={setNodeRef}
      className={`combine-zone ${isOver ? 'highlight' : ''}`}
    >
      조합 영역에 드롭
    </div>
  );
}
```

---

## 9. 프로젝트 초기 설정 커맨드

```bash
# Next.js 프로젝트 생성
npx create-next-app@latest infinite-girl \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir

cd infinite-girl

# 핵심 의존성 설치
npm install @supabase/supabase-js @supabase/ssr
npm install zustand
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Cloudflare Pages 배포 설정
npm install -D @cloudflare/next-on-pages
npm install -D wrangler

# UI (선택)
npx shadcn@latest init
```

### `wrangler.toml` 설정

```toml
name = "infinite-girl"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[[kv_namespaces]]
binding = "COMBO_CACHE"
id = "your-kv-namespace-id"
```

### `next.config.ts`

```typescript
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

if (process.env.NODE_ENV === 'development') {
  await setupDevPlatform();
}

const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: '*.supabase.co' }, // Supabase Storage
    ],
  },
};

export default nextConfig;
```

---

## 10. 주의해야 할 Cloudflare Pages + Next.js 제약

1. **ISR (Incremental Static Regeneration) 미지원**: `revalidate` 옵션 사용 불가. 대신 KV 캐시 사용.
2. **`next/image` 최적화**: Cloudflare Pages에서 Image Optimization이 제한됨. `unoptimized: true` 설정 필요하거나 Cloudflare Images 서비스 활용.
3. **환경변수**: Cloudflare Dashboard에서 설정, `process.env.NEXT_PUBLIC_*` 형태로 접근.
4. **빌드 명령**: `npx @cloudflare/next-on-pages` 로 빌드 후 배포.

---

## 11. 요약 체크리스트

- [x] DB: Supabase (PostgreSQL)
- [x] 배포: Cloudflare Pages
- [x] 프론트엔드: Next.js App Router (단일 `/` 라우트)
- [x] 백엔드 API: Next.js Route Handlers (Edge Runtime)
- [x] 캐시: Cloudflare KV (Redis 대체)
- [x] 실시간: Supabase Realtime
- [x] 상태관리: Zustand (persist 미들웨어)
- [x] DnD: dnd-kit
- [x] 이미지 생성: 별도 백엔드 (Replicate / RunningHub.ai)

---

*이 문서는 기술 스택 결정 시점의 스냅샷입니다. 구현 진행에 따라 업데이트 필요.*
