import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SmellMemory, Season, SmellType, Emotion } from '../utils/constants';
import { generateId } from '../utils/helpers';
import { toRevision, pushRevision, revisionFields } from '../utils/revisions';
import { mockMemories } from '../data/mockData';

export interface MemoryInput {
  location: string;
  source_guess: string;
  intensity: number;
  humidity: number;
  season: Season;
  smell_type: SmellType;
  memory_text: string;
  color_association: string;
  emotion: Emotion;
  want_again: boolean;
}

interface MemoryStore {
  memories: SmellMemory[];
  addMemory: (input: MemoryInput) => void;
  updateMemory: (id: string, input: MemoryInput) => void;
  restoreRevision: (id: string, revisionId: string) => void;
  deleteMemory: (id: string) => void;
  initIfEmpty: () => void;
}

export const useMemoryStore = create<MemoryStore>()(
  persist(
    (set, get) => ({
      memories: [],
      addMemory: (input) => {
        const now = new Date().toISOString();
        const newMem: SmellMemory = {
          id: generateId(),
          ...input,
          created_at: now,
          updated_at: now,
          revisions: [],
        };
        set({ memories: [newMem, ...get().memories] });
      },
      updateMemory: (id, input) => {
        const now = new Date().toISOString();
        set({
          memories: get().memories.map((m) =>
            m.id === id
              ? {
                  ...m,
                  ...input,
                  updated_at: now,
                  // 覆盖前先把当前内容留一份旧稿
                  revisions: pushRevision(m.revisions, toRevision(m, now)),
                }
              : m,
          ),
        });
      },
      restoreRevision: (id, revisionId) => {
        const now = new Date().toISOString();
        set({
          memories: get().memories.map((m) => {
            if (m.id !== id) return m;
            const target = m.revisions.find((r) => r.id === revisionId);
            if (!target) return m;
            const rest = m.revisions.filter((r) => r.id !== revisionId);
            return {
              ...m,
              ...revisionFields(target),
              updated_at: now,
              // 当前内容也回到旧稿列表，避免这次改动消失
              revisions: pushRevision(rest, toRevision(m, now)),
            };
          }),
        });
      },
      deleteMemory: (id) => {
        // 旧稿挂在记忆上，随记忆一起清掉
        set({ memories: get().memories.filter((m) => m.id !== id) });
      },
      initIfEmpty: () => {
        if (get().memories.length === 0) {
          set({ memories: mockMemories });
        }
      },
    }),
    {
      name: 'scent-memory-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as { memories?: SmellMemory[] };
        if (version < 1 && Array.isArray(state.memories)) {
          // 旧版本数据没有旧稿字段，补上空列表
          state.memories = state.memories.map((m) => ({ revisions: [], ...m }));
        }
        return state as unknown as MemoryStore;
      },
    },
  ),
);
