import type { MemoryRevision, SmellMemory } from './constants';
import { MAX_REVISIONS } from './constants';
import { generateId } from './helpers';

/** 把一条记忆的当前内容快照成一份旧稿 */
export function toRevision(memory: SmellMemory, savedAt: string): MemoryRevision {
  return {
    id: generateId(),
    saved_at: savedAt,
    location: memory.location,
    source_guess: memory.source_guess,
    intensity: memory.intensity,
    humidity: memory.humidity,
    season: memory.season,
    smell_type: memory.smell_type,
    memory_text: memory.memory_text,
    color_association: memory.color_association,
    emotion: memory.emotion,
    want_again: memory.want_again,
  };
}

/** 新旧稿放到最前，超出上限的更早旧稿自动挤掉 */
export function pushRevision(list: MemoryRevision[], rev: MemoryRevision): MemoryRevision[] {
  return [rev, ...list].slice(0, MAX_REVISIONS);
}

/** 取出旧稿里可写回记忆的内容字段（去掉旧稿自身的 id 和存档时间） */
export function revisionFields(rev: MemoryRevision): Omit<MemoryRevision, 'id' | 'saved_at'> {
  const { id, saved_at, ...fields } = rev;
  void id;
  void saved_at;
  return fields;
}
