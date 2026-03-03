# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server on port 3000
npm run build    # Production build
npm run lint     # Run ESLint
```

No test framework is configured.

## Architecture

**무한 소녀 (Infinite Girl)** is a Korean word-combination game (like Little Alchemy) built with Next.js App Router. Players drag and drop words to combine them; an AI generates new words from combinations.

### Data Flow

1. `page.tsx` fetches initial words from Supabase (server component)
2. `GameBoard.tsx` manages drag-and-drop (`@dnd-kit/core`) and auto-combines when 2 words are selected
3. Combinations call `POST /api/combine` (Edge runtime, Cloudflare Workers)
4. The combine route: checks client cache → Supabase DB → OpenAI API → saves to Supabase → caches

### Key Files

| File | Purpose |
|------|---------|
| `src/app/api/combine/route.ts` | Core combination logic (Edge runtime) |
| `src/components/GameBoard.tsx` | Game orchestrator with drag-and-drop |
| `src/store/gameStore.ts` | Zustand store (words + combinationCache persisted to localStorage) |
| `src/lib/supabase.ts` | DB operations — `getInitialWords`, `findCombination`, `saveCombination` |
| `src/lib/openai.ts` | OpenAI structured output (model: `gpt-5-mini`, returns `{name, emoji}`) |
| `src/lib/cache.ts` | Server-side in-memory cache with 1-hour TTL (pre-Cloudflare KV) |
| `src/types/game.ts` | `Word`, `Combination`, `CombineRequest/Response` types |

### Caching Strategy (three-tier)

1. **Browser** — Zustand `combinationCache` persisted in localStorage
2. **Server** — In-memory Map with 1-hour TTL (`src/lib/cache.ts`)
3. **Database** — Supabase (permanent); cache key is `"idA:idB"` with sorted IDs

### State Management

Zustand store in `gameStore.ts`:
- **Persisted** to localStorage: `words`, `combinationCache`
- **Session-only**: `selectedSlots`, `isLoading`, `newWord`

### OpenAI Integration

- Model: `gpt-5-mini-2025-08-07` with `reasoning_effort: 'low'`
- Structured JSON output enforced via schema: `{ name: string, emoji: string }`
- System prompt is in Korean with instructions for creative combinations

### Database (Supabase)

- `words` table: `id`, `name`, `emoji`, `image_url`, `is_initial`, `created_at`
- `combinations` table: join table with `word1_id`, `word2_id`, `result_word_id`
- IDs are sorted before lookup so `findCombination(A,B) == findCombination(B,A)`
- Duplicate word names are handled by reusing the existing word record

### Path Alias

`@/*` maps to `./src/*` in tsconfig.json.
