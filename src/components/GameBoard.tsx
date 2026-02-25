'use client';

import { useEffect, useCallback } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useGameStore } from '@/store/gameStore';
import { getCombinationKey } from '@/lib/cache';
import type { Element } from '@/types/game';
import ElementGrid from './ElementGrid';
import CombinationZone from './CombinationZone';
import NewElementToast from './NewElementToast';

interface GameBoardProps {
  initialElements: Element[];
}

export default function GameBoard({ initialElements }: GameBoardProps) {
  const {
    elements,
    selectedSlots,
    isLoading,
    newElement,
    initElements,
    addElement,
    selectElement,
    clearSlot,
    clearSlots,
    setCacheEntry,
    getCacheEntry,
    setLoading,
    setNewElement,
  } = useGameStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // 초기 원소 로드
  useEffect(() => {
    initElements(initialElements);
  }, [initElements, initialElements]);

  const handleCombine = useCallback(async () => {
    const [elemA, elemB] = selectedSlots;
    if (!elemA || !elemB) return;

    // 클라이언트 캐시 확인
    const cacheKey = getCombinationKey(elemA.id, elemB.id);
    const cached = getCacheEntry(cacheKey);
    if (cached) {
      addElement(cached);
      clearSlots();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/combine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elementAId: elemA.id,
          elementBId: elemB.id,
          elementAName: elemA.name,
          elementBName: elemB.name,
        }),
      });

      if (!res.ok) throw new Error('조합 실패');

      const data = await res.json() as { result: Element; isNew: boolean };
      const { result, isNew } = data;

      // 클라이언트 캐시에 저장
      setCacheEntry(cacheKey, result);
      addElement(result);
      clearSlots();

      if (isNew) {
        setNewElement(result);
      }
    } catch (err) {
      console.error(err);
      alert('조합에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }, [selectedSlots, getCacheEntry, addElement, clearSlots, setCacheEntry, setLoading, setNewElement]);

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

      // draggable id는 "grid-{elementId}" 형식
      const elementId = (active.id as string).replace('grid-', '');
      const element = elements.find((e) => e.id === elementId);
      if (!element) return;

      const slotIndex = overId === 'slot-0' ? 0 : 1;
      const newSlots: [Element | null, Element | null] = [...selectedSlots] as [Element | null, Element | null];
      newSlots[slotIndex] = element;

      // store 직접 업데이트 대신 selectElement 사용
      if (slotIndex === 0) {
        useGameStore.setState({ selectedSlots: [element, newSlots[1]] });
      } else {
        useGameStore.setState({ selectedSlots: [newSlots[0], element] });
      }
    },
    [elements, selectedSlots]
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-8">
        {/* 조합 영역 */}
        <section className="bg-white rounded-3xl shadow-sm p-6 flex justify-center">
          <CombinationZone
            slots={selectedSlots}
            isLoading={isLoading}
            onClearSlot={clearSlot}
            onCombine={handleCombine}
          />
        </section>

        {/* 원소 그리드 */}
        <section className="bg-white rounded-3xl shadow-sm p-6">
          <ElementGrid
            elements={elements}
            selectedSlots={selectedSlots}
            onSelectElement={selectElement}
          />
        </section>
      </div>

      {/* 첫 발견 토스트 */}
      <NewElementToast element={newElement} onClose={() => setNewElement(null)} />
    </DndContext>
  );
}
