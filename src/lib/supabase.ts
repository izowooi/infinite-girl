import { createClient } from '@supabase/supabase-js';
import type { Element } from '@/types/game';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getInitialElements(): Promise<Element[]> {
  const { data, error } = await supabase
    .from('elements')
    .select('*')
    .eq('is_initial', true)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Element[];
}

export async function findCombination(
  elementAId: string,
  elementBId: string
): Promise<Element | null> {
  const [a, b] = [elementAId, elementBId].sort();

  // combinations 조회
  const { data: combo, error: comboErr } = await supabase
    .from('combinations')
    .select('result_id')
    .eq('element_a_id', a)
    .eq('element_b_id', b)
    .eq('status', 'done')
    .maybeSingle();

  if (comboErr || !combo?.result_id) return null;

  // result element 조회
  const { data: element, error: elemErr } = await supabase
    .from('elements')
    .select('*')
    .eq('id', combo.result_id)
    .single();

  if (elemErr || !element) return null;
  return element as Element;
}

export async function saveCombination(
  elementAId: string,
  elementBId: string,
  result: Element
): Promise<Element> {
  const [a, b] = [elementAId, elementBId].sort();

  // 같은 이름의 원소가 이미 있는지 확인
  const { data: existing } = await supabase
    .from('elements')
    .select('*')
    .eq('name', result.name)
    .maybeSingle();

  let savedElement: Element;

  if (existing) {
    // 이미 존재하는 원소 사용
    savedElement = existing as Element;
  } else {
    // 새 원소 삽입
    const { data: inserted, error: insertErr } = await supabase
      .from('elements')
      .insert({
        id: result.id,
        name: result.name,
        emoji: result.emoji,
        is_initial: false,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;
    savedElement = inserted as Element;
  }

  // combinations 테이블에 저장 (이미 있으면 무시)
  await supabase.from('combinations').upsert(
    {
      element_a_id: a,
      element_b_id: b,
      result_id: savedElement.id,
      status: 'done',
    },
    { onConflict: 'element_a_id,element_b_id' }
  );

  return savedElement;
}
