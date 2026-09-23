import type { MemoryFields, MemoryRevision, SmellMemory } from '../utils/constants';

/** 每条记忆最多保留的旧稿份数，更早的自动挤掉 */
export const REVISION_LIMIT = 3;

const EDITABLE_KEYS: (keyof MemoryFields)[] = [
  'location',
  'source_guess',
  'intensity',
  'humidity',
  'season',
  'smell_type',
  'memory_text',
  'color_association',
  'emotion',
  'want_again',
];

/** 提取一份记忆的可编辑字段（不含 id、时间戳与旧稿列表） */
export function pickFields(m: SmellMemory): MemoryFields {
  return EDITABLE_KEYS.reduce(
    (acc, key) => ({ ...acc, [key]: m[key] }),
    {} as MemoryFields,
  );
}

/** 判断两份可编辑内容是否完全相同，相同则不必留存旧稿 */
export function sameFields(a: MemoryFields, b: MemoryFields): boolean {
  return EDITABLE_KEYS.every((key) => a[key] === b[key]);
}

/**
 * 编辑保存时：把当前内容作为旧稿压入列表头部，再挤掉超过上限的部分。
 * 内容没有实质变化时返回原列表，避免产生重复旧稿。
 */
export function pushRevision(
  current: SmellMemory,
  limit = REVISION_LIMIT,
): MemoryRevision[] {
  const revision: MemoryRevision = {
    ...pickFields(current),
    saved_at: current.updated_at,
  };
  return [revision, ...current.revisions].slice(0, limit);
}

/**
 * 恢复某份旧稿：当前内容回到旧稿列表，旧稿内容成为当前内容。
 * 当前内容以「此刻」存入旧稿列表头部，被恢复的那份从列表中移除，
 * 超过上限的更早旧稿自动挤掉。
 */
export function buildRevisionSwap(
  current: SmellMemory,
  target: MemoryRevision,
  restoredAt: string,
  limit = REVISION_LIMIT,
): { fields: MemoryFields; revisions: MemoryRevision[] } {
  const fields = { ...target };
  delete (fields as Partial<MemoryRevision>).saved_at;

  const currentAsRevision: MemoryRevision = {
    ...pickFields(current),
    saved_at: restoredAt,
  };
  const remaining = current.revisions.filter(
    (r) => r.saved_at !== target.saved_at,
  );

  return {
    fields: fields as MemoryFields,
    revisions: [currentAsRevision, ...remaining].slice(0, limit),
  };
}
