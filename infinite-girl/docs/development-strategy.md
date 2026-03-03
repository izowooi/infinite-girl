# 무한 소녀 - 개발 전략 및 로드맵

작성일: 2026-02-25

---

## 1. Top-down vs Bottom-up: 어떤 게 맞나?

### 전통적 개발에서의 선택

| 전략 | 장점 | 단점 |
|------|------|------|
| **Top-down** | 전체 구조가 명확, 인터페이스 정의로 병렬 작업 가능 | 초반에 추상화 과잉, 실제 요구사항 불명확 시 재설계 필요 |
| **Bottom-up** | 빠른 검증, 실제 작동하는 부분부터 쌓음 | 전체 그림 없이 진행 → 나중에 통합 시 충돌 |

### AI 어시스턴트와 함께하는 개발에서의 핵심 인사이트

> **"한 방에 만든다"는 환상이다.**

AI(Claude, Cursor 등)가 코드를 잘 생성하는 조건은 **명확한 컨텍스트**다. 컨텍스트가 부족하면 AI는 그럴듯하지만 실제로 연결이 안 되는 코드를 생성한다. 반대로 컨텍스트가 너무 많으면 AI의 응답 품질이 저하된다.

따라서 AI 어시스턴트 개발의 최적 전략은:

```
"Schema & Types 먼저 → 수직 슬라이스 단위로 구현"
```

**수직 슬라이스(Vertical Slice)**: 하나의 기능을 DB → API → UI까지 완전히 구현하는 방식. 각 슬라이스가 완결되므로 AI에게 줄 컨텍스트가 명확하고, 항상 작동하는 코드가 존재한다.

---

## 2. 이 프로젝트의 추천 전략

### "컨텍스트 주도 수직 슬라이스" (Context-Driven Vertical Slice)

```
Phase 0: 기반 다지기 (Foundation)
    ↓ DB 스키마 + TypeScript 타입 정의 (모든 AI 생성의 컨텍스트)
Phase 1: 핵심 게임 루프 (Core Loop)
    ↓ "조합 → 텍스트 결과" 까지 End-to-End
Phase 2: 데이터 연동 (Data Layer)
    ↓ Supabase 연동 + KV 캐싱
Phase 3: 실시간 + 이미지 (Realtime & Image)
    ↓ 이미지 생성 백엔드 연동 + Supabase Realtime
Phase 4: UX 완성 (Polish)
    ↓ 애니메이션, 에러 처리, 최적화
```

---

## 3. 왜 "AI API 먼저"가 아닌가?

이미지 생성 API를 먼저 만들고 싶은 욕구는 자연스럽지만, 다음 이유로 비효율적이다:

1. **검증 환경이 없다.** API가 완성돼도 붙일 UI가 없으면 매번 curl이나 Postman으로 테스트해야 한다.
2. **명세가 변한다.** UI를 만들다 보면 API의 응답 형태, 에러 처리 방식이 달라진다. 미리 만든 API를 수정하는 비용이 발생한다.
3. **동기 부여가 떨어진다.** 이미지가 실제 게임 화면에 나타나는 순간의 피드백이 없으면 개발 흐름이 끊긴다.

---

## 4. 상세 로드맵

---

### Phase 0: Foundation (기반)

> 목표: 모든 AI 코드 생성의 "공통 컨텍스트"를 만든다.

이 단계를 잘 만들면, 이후 모든 Phase에서 AI에게 "이 타입과 스키마를 기반으로 구현해줘"라고 말할 수 있다.

#### 0-1. Supabase DB 스키마 설계 및 생성

```sql
-- 기본 요소 테이블
create table elements (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,           -- "물", "불", "소녀"
  emoji       text,                           -- "💧" (생성 전 임시 표시)
  image_url   text,                           -- Supabase Storage URL
  is_initial  boolean not null default false, -- 초기 4개 요소 여부
  created_at  timestamptz default now()
);

-- 조합 결과 테이블
create table combinations (
  id              uuid primary key default gen_random_uuid(),
  element_a_id    uuid not null references elements(id),
  element_b_id    uuid not null references elements(id),
  result_id       uuid references elements(id), -- 생성 완료 시 채워짐
  status          text not null default 'pending', -- pending | generating | done | failed
  created_at      timestamptz default now(),

  -- 항상 a_id < b_id 가 되도록 check constraint (중복 방지)
  check (element_a_id <= element_b_id),
  unique (element_a_id, element_b_id)
);

-- 인덱스
create index on combinations(element_a_id, element_b_id);
create index on combinations(status) where status != 'done';
```

#### 0-2. TypeScript 타입 정의

`types/game.ts`를 먼저 작성. 이것이 프론트엔드-백엔드 간 "계약서"다.

```typescript
// types/game.ts
export type ElementStatus = 'pending' | 'generating' | 'done' | 'failed';

export interface Element {
  id: string;
  name: string;
  emoji: string | null;
  imageUrl: string | null;
  isInitial: boolean;
  createdAt: string;
}

export interface Combination {
  id: string;
  elementAId: string;
  elementBId: string;
  resultId: string | null;
  status: ElementStatus;
}

// API 응답 타입
export interface CombineResponse {
  status: 'cached' | 'pending';
  combination: Combination;
  result?: Element; // status가 'cached'일 때만 존재
}
```

#### 0-3. 프로젝트 스캐폴딩

```bash
npx create-next-app@latest infinite-girl --typescript --tailwind --app --src-dir
cd infinite-girl
npm install @supabase/supabase-js @supabase/ssr zustand @dnd-kit/core @dnd-kit/sortable
npm install -D @cloudflare/next-on-pages wrangler
```

**산출물**: 실행되는 Next.js 앱 + 연결된 Supabase + 타입 정의

---

### Phase 1: 핵심 게임 루프 (Core Loop)

> 목표: "게임이 작동한다"는 상태. 이미지 없어도 OK, AI 없어도 OK.

텍스트만으로 조합이 작동하면, 게임의 재미를 바로 검증할 수 있다.

#### 1-1. 조합 API - 텍스트 결과만

```
POST /api/combine
Body: { elementAId, elementBId }
Response: { status: 'cached' | 'pending', result?: Element }
```

- DB에서 기존 조합 조회 → 있으면 즉시 반환
- 없으면 Claude API (또는 GPT) 동기 호출로 텍스트 결과 생성
- 이 단계에서는 이미지 없이 emoji만으로 표시

> **AI 활용 포인트**: 이 API 하나를 완성하는 데 Phase 0의 타입 + 스키마를 컨텍스트로 주면 AI가 거의 완벽한 코드를 생성한다.

#### 1-2. 게임 UI - 기본 레이아웃

```
┌─────────────────────────────────────────────┐
│                  무한 소녀                   │
├──────────────────────┬──────────────────────┤
│                      │  내 컬렉션           │
│   조합 공간          │  ┌──┐ ┌──┐ ┌──┐     │
│                      │  │🌊│ │🔥│ │🌬│     │
│   [드래그 여기]      │  └──┘ └──┘ └──┘     │
│                      │  ┌──┐ ┌──┐          │
│                      │  │🌍│ │💧│          │
│                      │  └──┘ └──┘          │
└──────────────────────┴──────────────────────┘
```

- `ElementCard`: 드래그 가능한 요소 카드
- `CombineZone`: 두 요소를 드롭해서 조합하는 영역
- `ElementGrid`: 보유 요소 목록

#### 1-3. Zustand 스토어 연결

```typescript
// store/gameStore.ts
const useGameStore = create(persist((set, get) => ({
  unlockedElements: INITIAL_ELEMENTS,

  combineElements: async (a: Element, b: Element) => {
    const res = await fetch('/api/combine', {
      method: 'POST',
      body: JSON.stringify({ elementAId: a.id, elementBId: b.id })
    });
    const data: CombineResponse = await res.json();

    if (data.status === 'cached' && data.result) {
      set(state => ({
        unlockedElements: [...state.unlockedElements, data.result!]
      }));
    }
    // pending이면 Phase 3에서 처리
  }
}), { name: 'infinite-girl' }));
```

**산출물**: 실제로 조합이 되는 게임. 이미지 없이 이모지로 표시되지만 게임 루프 완성.

---

### Phase 2: 데이터 영속성 (Data Layer)

> 목표: 새로고침해도 진행 상황이 유지, 캐싱으로 빠른 응답.

#### 2-1. Cloudflare KV 캐싱 연동

자주 조회되는 조합 결과를 KV에 캐싱. Phase 1에서 만든 API에 캐싱 레이어 추가.

```typescript
// 조합 조회 순서: KV → Supabase → AI 생성
const cacheKey = `combo:${[aId, bId].sort().join(':')}`;
const cached = await env.KV.get(cacheKey, 'json');
```

#### 2-2. 사용자 컬렉션 영속성

- `localStorage` (Zustand persist): 로그인 없이 브라우저에 저장
- Supabase `user_collections` 테이블: 로그인 시 서버 동기화

> 초기에는 localStorage만으로도 충분. 로그인 기능은 나중에 추가.

**산출물**: 빠른 응답 + 새로고침에도 진행 상황 유지.

---

### Phase 3: 실시간 + 이미지 (Realtime & Image)

> 목표: 이미지 생성 백엔드와 연동, 생성 완료 시 실시간 UI 업데이트.

이 단계에서 이미지 생성 백엔드(Replicate/RunningHub)가 준비되어 있어야 한다.

#### 3-1. 이미지 생성 흐름

```
1. POST /api/combine → status: 'pending' 반환
2. 이미지 생성 백엔드가 Supabase combinations 테이블을 폴링하거나 웹훅 수신
3. 이미지 생성 완료 → combinations.status = 'done', elements.image_url 업데이트
4. Supabase Realtime이 클라이언트에 이벤트 전달
5. UI 업데이트 (emoji → 이미지)
```

#### 3-2. Supabase Realtime 클라이언트

```typescript
// hooks/useCombinationStatus.ts
export function useCombinationStatus(combinationId: string) {
  const [status, setStatus] = useState<ElementStatus>('pending');

  useEffect(() => {
    const channel = supabase
      .channel(`combo-${combinationId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'combinations',
        filter: `id=eq.${combinationId}`,
      }, (payload) => {
        setStatus(payload.new.status);
        if (payload.new.status === 'done') {
          channel.unsubscribe();
        }
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [combinationId]);

  return status;
}
```

#### 3-3. 이미지 로딩 UX

```
[조합 직후]      [생성 중]         [완료]
┌──────────┐    ┌──────────┐    ┌──────────┐
│    ⟳     │ →  │  ░░░░░░  │ →  │  [이미지] │
│  생성 중  │    │  로딩中   │    │  소녀 이름 │
└──────────┘    └──────────┘    └──────────┘
```

**산출물**: 이미지가 나오는 완성된 게임.

---

### Phase 4: UX 완성 (Polish)

> 목표: 게임이 재밌다고 느껴지는 수준.

- 조합 성공 애니메이션 (Framer Motion)
- "최초 발견!" 효과 (전 세계 최초 조합 시)
- 모바일 터치 지원 (dnd-kit 기본 지원)
- 에러 처리 (네트워크 오류, 생성 실패)
- 로딩 스켈레톤

---

## 5. AI 어시스턴트 활용 가이드

### 각 Phase별 AI에게 줄 컨텍스트

| Phase | AI에게 주어야 할 컨텍스트 |
|-------|--------------------------|
| 0 | 게임 기획 문서 |
| 1 | 스키마 + 타입 정의 |
| 2 | 완성된 API + 타입 정의 |
| 3 | API 명세 + 완성된 Zustand 스토어 |
| 4 | 전체 코드베이스 |

### 효과적인 AI 활용 패턴

```
❌ 비효율: "InfiniteCraft 클론을 만들어줘"
✅ 효율: "다음 타입과 스키마를 기반으로 /api/combine Route Handler를
         Edge Runtime에서 작동하도록 구현해줘. [타입 코드] [스키마]"
```

---

## 6. 실행 우선순위 요약

```
Week 1:  Phase 0 완료 + Phase 1 시작
Week 2:  Phase 1 완료 (텍스트 조합 게임 완성)
Week 3:  Phase 2 완료 (캐싱 + 영속성)
Week 4+: Phase 3 (이미지 생성 백엔드 준비와 병렬 진행)
```

**첫 번째로 할 것**: Supabase에 스키마 만들기 + `types/game.ts` 작성.
이 두 파일이 완성되는 순간, 나머지 모든 코드를 AI와 함께 빠르게 작성할 수 있다.

---

*이미지 생성 백엔드는 Phase 3 시작 전에 별도로 준비 필요. Phase 1-2 진행 중 병렬로 작업 가능.*
