'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Word } from '@/types/game';

interface GameState {
  // 지속성 저장 상태
  words: Word[];
  combinationCache: Record<string, Word>; // "idA:idB" → result

  // 세션 임시 상태 (저장 안함)
  selectedSlots: [Word | null, Word | null];
  isLoading: boolean;
  newWord: Word | null;

  // 액션
  initWords: (words: Word[]) => void;
  addWord: (word: Word) => void;
  selectWord: (word: Word) => void;
  clearSlot: (index: 0 | 1) => void;
  clearSlots: () => void;
  setCacheEntry: (key: string, word: Word) => void;
  getCacheEntry: (key: string) => Word | undefined;
  setLoading: (loading: boolean) => void;
  setNewWord: (word: Word | null) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      words: [],
      combinationCache: {},
      selectedSlots: [null, null],
      isLoading: false,
      newWord: null,

      initWords: (words) => {
        const existing = get().words;
        if (existing.length === 0) {
          set({ words });
        } else {
          const existingIds = new Set(existing.map((w) => w.id));
          const missing = words.filter((w) => !existingIds.has(w.id));
          if (missing.length > 0) {
            set({ words: [...existing, ...missing] });
          }
        }
      },

      addWord: (word) => {
        const existing = get().words;
        if (!existing.find((w) => w.id === word.id)) {
          set({ words: [...existing, word] });
        }
      },

      selectWord: (word) => {
        const [slot0, slot1] = get().selectedSlots;
        if (slot0 === null) {
          set({ selectedSlots: [word, slot1] });
        } else if (slot1 === null) {
          set({ selectedSlots: [slot0, word] });
        } else {
          set({ selectedSlots: [word, slot1] });
        }
      },

      clearSlot: (index) => {
        const slots = [...get().selectedSlots] as [Word | null, Word | null];
        slots[index] = null;
        set({ selectedSlots: slots });
      },

      clearSlots: () => set({ selectedSlots: [null, null] }),

      setCacheEntry: (key, word) => {
        set((state) => ({
          combinationCache: { ...state.combinationCache, [key]: word },
        }));
      },

      getCacheEntry: (key) => get().combinationCache[key],

      setLoading: (loading) => set({ isLoading: loading }),

      setNewWord: (word) => set({ newWord: word }),
    }),
    {
      name: 'infinite-girl-game',
      partialize: (state) => ({
        words: state.words,
        combinationCache: state.combinationCache,
      }),
    }
  )
);
