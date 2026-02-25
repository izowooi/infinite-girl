'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Element } from '@/types/game';

interface GameState {
  // 지속성 저장 상태
  elements: Element[];
  combinationCache: Record<string, Element>; // "idA:idB" → result

  // 세션 임시 상태 (저장 안함)
  selectedSlots: [Element | null, Element | null];
  isLoading: boolean;
  newElement: Element | null;

  // 액션
  initElements: (elements: Element[]) => void;
  addElement: (element: Element) => void;
  selectElement: (element: Element) => void;
  clearSlot: (index: 0 | 1) => void;
  clearSlots: () => void;
  setCacheEntry: (key: string, element: Element) => void;
  getCacheEntry: (key: string) => Element | undefined;
  setLoading: (loading: boolean) => void;
  setNewElement: (element: Element | null) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      elements: [],
      combinationCache: {},
      selectedSlots: [null, null],
      isLoading: false,
      newElement: null,

      initElements: (elements) => {
        const existing = get().elements;
        if (existing.length === 0) {
          set({ elements });
        } else {
          // 기존 발견 원소 유지 + 초기 원소만 없으면 추가
          const existingIds = new Set(existing.map((e) => e.id));
          const missing = elements.filter((e) => !existingIds.has(e.id));
          if (missing.length > 0) {
            set({ elements: [...existing, ...missing] });
          }
        }
      },

      addElement: (element) => {
        const existing = get().elements;
        if (!existing.find((e) => e.id === element.id)) {
          set({ elements: [...existing, element] });
        }
      },

      selectElement: (element) => {
        const [slot0, slot1] = get().selectedSlots;
        if (slot0 === null) {
          set({ selectedSlots: [element, slot1] });
        } else if (slot1 === null) {
          set({ selectedSlots: [slot0, element] });
        } else {
          // 둘 다 채워진 경우 첫 번째 교체
          set({ selectedSlots: [element, slot1] });
        }
      },

      clearSlot: (index) => {
        const slots = [...get().selectedSlots] as [Element | null, Element | null];
        slots[index] = null;
        set({ selectedSlots: slots });
      },

      clearSlots: () => set({ selectedSlots: [null, null] }),

      setCacheEntry: (key, element) => {
        set((state) => ({
          combinationCache: { ...state.combinationCache, [key]: element },
        }));
      },

      getCacheEntry: (key) => get().combinationCache[key],

      setLoading: (loading) => set({ isLoading: loading }),

      setNewElement: (element) => set({ newElement: element }),
    }),
    {
      name: 'infinite-girl-game',
      partialize: (state) => ({
        elements: state.elements,
        combinationCache: state.combinationCache,
      }),
    }
  )
);
