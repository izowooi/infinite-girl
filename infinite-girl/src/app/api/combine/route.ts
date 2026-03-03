import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getCombinationKey, getCached, setCached } from '@/lib/cache';
import { findCombination, saveCombination } from '@/lib/supabase';
import { generateCombination } from '@/lib/openai';
import type { CombineRequest, CombineResponse } from '@/types/game';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CombineRequest;
    const { wordAId, wordBId, wordAName, wordBName } = body;

    if (!wordAId || !wordBId || !wordAName || !wordBName) {
      return NextResponse.json({ error: '단어 ID와 이름이 필요합니다' }, { status: 400 });
    }

    const cacheKey = getCombinationKey(wordAId, wordBId);

    // 1단계: 서버 인메모리 캐시 조회
    const cached = getCached(cacheKey);
    if (cached) {
      return NextResponse.json({ result: cached, isNew: false } satisfies CombineResponse);
    }

    // 2단계: Supabase DB 조회
    const existing = await findCombination(wordAId, wordBId);
    if (existing) {
      setCached(cacheKey, existing);
      return NextResponse.json({ result: existing, isNew: false } satisfies CombineResponse);
    }

    // 3단계: OpenAI API로 새 조합 생성
    const generated = await generateCombination(wordAName, wordBName);

    const newWord = {
      id: uuidv4(),
      name: generated.name,
      emoji: generated.emoji,
      image_url: null,
      thumbnail_url: null,
      is_initial: false,
      created_at: new Date().toISOString(),
    };

    // 4단계: Supabase에 저장 (실제 저장된 word 반환)
    const savedWord = await saveCombination(wordAId, wordBId, newWord);

    // 5단계: 캐시에 저장
    setCached(cacheKey, savedWord);

    return NextResponse.json({ result: savedWord, isNew: true } satisfies CombineResponse);
  } catch (error) {
    console.error('조합 API 오류:', error);
    return NextResponse.json({ error: '조합 생성에 실패했습니다' }, { status: 500 });
  }
}
