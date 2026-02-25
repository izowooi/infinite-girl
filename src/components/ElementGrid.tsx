'use client';

import type { Element } from '@/types/game';
import ElementCard from './ElementCard';

interface ElementGridProps {
  elements: Element[];
  selectedSlots: [Element | null, Element | null];
  onSelectElement: (element: Element) => void;
}

export default function ElementGrid({ elements, selectedSlots, onSelectElement }: ElementGridProps) {
  const selectedIds = new Set(selectedSlots.filter(Boolean).map((e) => e!.id));

  const initialElements = elements.filter((e) => e.is_initial);
  const discoveredElements = elements.filter((e) => !e.is_initial);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          원소 목록
        </h2>
        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
          {elements.length}개 발견
        </span>
      </div>

      {discoveredElements.length > 0 && (
        <>
          <p className="text-xs text-slate-400 mb-2">✨ 새로 발견한 원소</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {discoveredElements.map((element) => (
              <ElementCard
                key={element.id}
                element={element}
                isSelected={selectedIds.has(element.id)}
                onClick={() => onSelectElement(element)}
                draggableId={`grid-${element.id}`}
              />
            ))}
          </div>
          <div className="border-t border-slate-100 mb-3" />
        </>
      )}

      <p className="text-xs text-slate-400 mb-2">🌱 기본 원소</p>
      <div className="flex flex-wrap gap-2">
        {initialElements.map((element) => (
          <ElementCard
            key={element.id}
            element={element}
            isSelected={selectedIds.has(element.id)}
            onClick={() => onSelectElement(element)}
            draggableId={`grid-${element.id}`}
          />
        ))}
      </div>
    </div>
  );
}
