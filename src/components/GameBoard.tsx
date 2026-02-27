'use client';

import { useEffect, useCallback } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useGameStore } from '@/store/gameStore';
import { getCombinationKey } from '@/lib/cache';
import type { Word } from '@/types/game';
import WordGrid from './WordGrid';
import CombinationZone from './CombinationZone';
import NewWordToast from './NewWordToast';

interface GameBoardProps {
  initialWords: Word[];
}

export default function GameBoard({ initialWords }: GameBoardProps) {
  const {
    words,
    selectedSlots,
    isLoading,
    newWord,
    initWords,
    addWord,
    selectWord,
    clearSlot,
    clearSlots,
    setCacheEntry,
    getCacheEntry,
    setLoading,
    setNewWord,
  } = useGameStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    initWords(initialWords);
  }, [initWords, initialWords]);

  const handleCombine = useCallback(async () => {
    const [wordA, wordB] = selectedSlots;
    if (!wordA || !wordB) return;

    const cacheKey = getCombinationKey(wordA.id, wordB.id);
    const cached = getCacheEntry(cacheKey);
    if (cached) {
      addWord(cached);
      clearSlots();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/combine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordAId: wordA.id,
          wordBId: wordB.id,
          wordAName: wordA.name,
          wordBName: wordB.name,
        }),
      });

      if (!res.ok) throw new Error('조합 실패');

      const data = await res.json() as { result: Word; isNew: boolean };
      const { result, isNew } = data;

      setCacheEntry(cacheKey, result);
      addWord(result);
      clearSlots();

      if (isNew) {
        setNewWord(result);
      }
    } catch (err) {
      console.error(err);
      alert('조합에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }, [selectedSlots, getCacheEntry, addWord, clearSlots, setCacheEntry, setLoading, setNewWord]);

  // 2개 선택되면 자동 조합
  useEffect(() => {
    if (selectedSlots[0] && selectedSlots[1] && !isLoading) {
      handleCombine();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlots[0]?.id, selectedSlots[1]?.id]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const overId = over.id as string;
      if (overId !== 'slot-0' && overId !== 'slot-1') return;

      const wordId = (active.id as string).replace('grid-', '');
      const word = words.find((w) => w.id === wordId);
      if (!word) return;

      const slotIndex = overId === 'slot-0' ? 0 : 1;
      const newSlots: [Word | null, Word | null] = [...selectedSlots] as [Word | null, Word | null];
      newSlots[slotIndex] = word;

      if (slotIndex === 0) {
        useGameStore.setState({ selectedSlots: [word, newSlots[1]] });
      } else {
        useGameStore.setState({ selectedSlots: [newSlots[0], word] });
      }
    },
    [words, selectedSlots]
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-8">
        <section className="bg-white rounded-3xl shadow-sm p-6 flex justify-center">
          <CombinationZone
            slots={selectedSlots}
            isLoading={isLoading}
            onClearSlot={clearSlot}
            onCombine={handleCombine}
          />
        </section>

        <section className="bg-white rounded-3xl shadow-sm p-6">
          <WordGrid
            words={words}
            selectedSlots={selectedSlots}
            onSelectWord={selectWord}
          />
        </section>
      </div>

      <NewWordToast word={newWord} onClose={() => setNewWord(null)} />
    </DndContext>
  );
}
