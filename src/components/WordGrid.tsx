'use client';

import type { Word } from '@/types/game';
import WordCard from './WordCard';

interface WordGridProps {
  words: Word[];
  selectedSlots: [Word | null, Word | null];
  onSelectWord: (word: Word) => void;
}

export default function WordGrid({ words, selectedSlots, onSelectWord }: WordGridProps) {
  const selectedIds = new Set(selectedSlots.filter(Boolean).map((w) => w!.id));

  const initialWords = words.filter((w) => w.is_initial);
  const discoveredWords = words.filter((w) => !w.is_initial);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          단어 목록
        </h2>
        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
          {words.length}개 발견
        </span>
      </div>

      {discoveredWords.length > 0 && (
        <>
          <p className="text-xs text-slate-400 mb-2">✨ 새로 발견한 단어</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {discoveredWords.map((word) => (
              <WordCard
                key={word.id}
                word={word}
                isSelected={selectedIds.has(word.id)}
                onClick={() => onSelectWord(word)}
                draggableId={`grid-${word.id}`}
              />
            ))}
          </div>
          <div className="border-t border-slate-100 mb-3" />
        </>
      )}

      <p className="text-xs text-slate-400 mb-2">🌱 기본 단어</p>
      <div className="flex flex-wrap gap-2">
        {initialWords.map((word) => (
          <WordCard
            key={word.id}
            word={word}
            isSelected={selectedIds.has(word.id)}
            onClick={() => onSelectWord(word)}
            draggableId={`grid-${word.id}`}
          />
        ))}
      </div>
    </div>
  );
}
