import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SmellMemory } from '../utils/constants';
import type { MemoryFields } from '../utils/constants';
import { generateId } from '../utils/helpers';
import { mockMemories } from '../data/mockData';
import {
  pushRevision,
  sameFields,
  buildRevisionSwap,
} from '../domain/revisions';

/** 新增/编辑表单提交的数据结构 */
export type MemoryInput = MemoryFields;

/** 兼容旧版本持久化数据：补上 revisions 字段 */
function normalizeMemories(memories: unknown): SmellMemory[] {
  if (!Array.isArray(memories)) return [];
  return (memories as SmellMemory[]).map((m) => ({
    ...m,
    revisions: Array.isArray(m.revisions) ? m.revisions : [],
  }));
}

interface MemoryStore {
  memories: SmellMemory[];
  addMemory: (input: MemoryInput) => void;
  updateMemory: (id: string, input: MemoryInput) => void;
  /** 恢复某份旧稿：当前内容回到旧稿列表，旧稿内容成为当前内容 */
  restoreRevision: (id: string, savedAt: string) => void;
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
          ...input,
          id: generateId(),
          created_at: now,
          updated_at: now,
          revisions: [],
        };
        set({ memories: [newMem, ...get().memories] });
      },
      updateMemory: (id, input) => {
        const now = new Date().toISOString();
        set({
          memories: get().memories.map((m) => {
            if (m.id !== id || sameFields(m, input)) return m;
            // 先把当前内容存入旧稿列表（保留三份，更早的挤掉），再覆盖
            return {
              ...m,
              ...input,
              updated_at: now,
              revisions: pushRevision({ ...m, updated_at: now }),
            };
          }),
        });
      },
      restoreRevision: (id, savedAt) => {
        const now = new Date().toISOString();
        set({
          memories: get().memories.map((m) => {
            if (m.id !== id) return m;
            const target = m.revisions.find((r) => r.saved_at === savedAt);
            if (!target) return m;
            const { fields, revisions } = buildRevisionSwap(m, target, now);
            return { ...m, ...fields, updated_at: now, revisions };
          }),
        });
      },
      deleteMemory: (id) => {
        // 旧稿随记忆本体一起删除
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
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<MemoryStore>;
        return {
          ...current,
          ...p,
          memories: normalizeMemories(p.memories ?? current.memories),
        };
      },
    },
  ),
);
