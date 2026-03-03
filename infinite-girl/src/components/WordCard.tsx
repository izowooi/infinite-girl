'use client';

import { useDraggable } from '@dnd-kit/core';
import type { Word } from '@/types/game';

interface WordCardProps {
  word: Word;
  isSelected?: boolean;
  onClick?: () => void;
  draggableId?: string;
}

export default function WordCard({
  word,
  isSelected,
  onClick,
  draggableId,
}: WordCardProps) {
  const id = draggableId ?? word.id;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={[
        'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl cursor-pointer',
        'border-2 select-none transition-all duration-150',
        'min-w-[72px] text-center',
        isSelected
          ? 'border-purple-400 bg-purple-100 shadow-md scale-105'
          : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50 hover:shadow-sm',
        isDragging ? 'opacity-50 scale-95 z-50' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="text-2xl leading-none">{word.emoji}</span>
      <span className="text-xs font-medium text-slate-700 whitespace-nowrap">{word.name}</span>
    </div>
  );
}
