import { createClient } from '@supabase/supabase-js';
import type { Word } from '@/types/game';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getInitialWords(): Promise<Word[]> {
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .eq('is_initial', true)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Word[];
}

export async function findCombination(
  wordAId: string,
  wordBId: string
): Promise<Word | null> {
  const [a, b] = [wordAId, wordBId].sort();

  const { data: combo, error: comboErr } = await supabase
    .from('combinations')
    .select('result_id')
    .eq('word_a_id', a)
    .eq('word_b_id', b)
    .eq('status', 'done')
    .maybeSingle();

  if (comboErr || !combo?.result_id) return null;

  const { data: word, error: wordErr } = await supabase
    .from('words')
    .select('*')
    .eq('id', combo.result_id)
    .single();

  if (wordErr || !word) return null;
  return word as Word;
}

export async function saveCombination(
  wordAId: string,
  wordBId: string,
  result: Word
): Promise<Word> {
  const [a, b] = [wordAId, wordBId].sort();

  // 같은 이름의 단어가 이미 있는지 확인
  const { data: existing } = await supabase
    .from('words')
    .select('*')
    .eq('name', result.name)
    .maybeSingle();

  let savedWord: Word;

  if (existing) {
    savedWord = existing as Word;
  } else {
    const { data: inserted, error: insertErr } = await supabase
      .from('words')
      .insert({
        id: result.id,
        name: result.name,
        emoji: result.emoji,
        is_initial: false,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;
    savedWord = inserted as Word;
  }

  await supabase.from('combinations').upsert(
    {
      word_a_id: a,
      word_b_id: b,
      result_id: savedWord.id,
      status: 'done',
    },
    { onConflict: 'word_a_id,word_b_id' }
  );

  return savedWord;
}
