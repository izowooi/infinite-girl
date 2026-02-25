'use client';

import { useDroppable } from '@dnd-kit/core';
import type { Element } from '@/types/game';

interface SlotProps {
  index: 0 | 1;
  element: Element | null;
  onClear: () => void;
}

function Slot({ index, element, onClear }: SlotProps) {
  const { isOver, setNodeRef } = useDroppable({ id: `slot-${index}` });

  return (
    <div
      ref={setNodeRef}
      className={[
        'flex flex-col items-center justify-center gap-1 rounded-2xl',
        'w-28 h-28 border-2 border-dashed transition-all duration-150',
        isOver ? 'border-purple-500 bg-purple-50 scale-105' : 'border-slate-300 bg-slate-50',
        element ? 'border-solid border-purple-300 bg-purple-50' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {element ? (
        <>
          <span className="text-3xl">{element.emoji}</span>
          <span className="text-sm font-medium text-slate-700">{element.name}</span>
          <button
            onClick={onClear}
            className="text-xs text-slate-400 hover:text-red-400 mt-1 transition-colors"
          >
            ✕ 취소
          </button>
        </>
      ) : (
        <span className="text-slate-300 text-sm">
          {index === 0 ? '첫 번째' : '두 번째'}
          <br />
          원소
        </span>
      )}
    </div>
  );
}

interface CombinationZoneProps {
  slots: [Element | null, Element | null];
  isLoading: boolean;
  onClearSlot: (index: 0 | 1) => void;
  onCombine: () => void;
}

export default function CombinationZone({
  slots,
  isLoading,
  onClearSlot,
  onCombine,
}: CombinationZoneProps) {
  const canCombine = slots[0] !== null && slots[1] !== null && !isLoading;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <Slot index={0} element={slots[0]} onClear={() => onClearSlot(0)} />
        <span className="text-2xl text-slate-400 font-light">+</span>
        <Slot index={1} element={slots[1]} onClear={() => onClearSlot(1)} />
      </div>

      <button
        onClick={onCombine}
        disabled={!canCombine}
        className={[
          'px-8 py-3 rounded-full font-semibold text-sm transition-all duration-150',
          canCombine
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed',
        ].join(' ')}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            조합 중...
          </span>
        ) : (
          '✨ 조합하기'
        )}
      </button>
    </div>
  );
}
