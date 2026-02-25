'use client';

import { useEffect, useState } from 'react';
import type { Element } from '@/types/game';

interface NewElementToastProps {
  element: Element | null;
  onClose: () => void;
}

export default function NewElementToast({ element, onClose }: NewElementToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (element) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [element, onClose]);

  if (!element) return null;

  return (
    <div
      className={[
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl',
        'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
        'transition-all duration-300',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
      ].join(' ')}
    >
      <span className="text-3xl">{element.emoji}</span>
      <div>
        <p className="text-xs font-medium opacity-80">첫 발견!</p>
        <p className="text-lg font-bold">{element.name}</p>
      </div>
      <span className="text-xl ml-1">🎉</span>
    </div>
  );
}
