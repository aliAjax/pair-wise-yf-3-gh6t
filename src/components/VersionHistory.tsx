import { History, RotateCcw } from 'lucide-react';
import type { SmellMemory } from '../utils/constants';
import { getSeasonInfo } from '../utils/constants';
import { formatDate } from '../utils/helpers';
import { REVISION_LIMIT } from '../domain/revisions';

interface Props {
  memory: SmellMemory;
  onRestore: (savedAt: string) => void;
}

/** 卡片展开区的「旧稿」面板：展示历史稿件摘要，可选择一份恢复 */
export default function VersionHistory({ memory, onRestore }: Props) {
  const { revisions } = memory;

  return (
    <div className="mt-3 p-4 rounded-xl bg-paper-100/70 border border-paper-200/80">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-hand text-lg text-ochre-600 inline-flex items-center gap-1.5">
          <History className="w-4 h-4" /> 旧稿
        </span>
        <span className="text-[11px] text-ink-700/45">
          已留存 {revisions.length}/{REVISION_LIMIT} 份 · 最多保留三份，更早的自动挤掉
        </span>
      </div>

      {revisions.length === 0 ? (
        <p className="text-xs text-ink-700/50 py-1">
          还没有旧稿。每次保存修改时，旧内容会自动在这里留存一份。
        </p>
      ) : (
        <ul className="space-y-2">
          {revisions.map((r) => {
            const season = getSeasonInfo(r.season);
            return (
              <li
                key={r.saved_at}
                className="flex items-center justify-between gap-3 rounded-lg bg-paper-50/80 border border-paper-200/70 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-700/75">
                    <span className="font-medium text-ink-800">
                      {formatDate(r.saved_at)}
                    </span>
                    <span aria-hidden className="text-ink-700/30">·</span>
                    <span>
                      强度
                      <span className="font-semibold text-ochre-600 ml-0.5">
                        {r.intensity}/10
                      </span>
                    </span>
                    <span aria-hidden className="text-ink-700/30">·</span>
                    <span>
                      {season.emoji} {season.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-700/50 mt-0.5 truncate">
                    {r.location}｜{r.source_guess || '未记录气味来源'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRestore(r.saved_at)}
                  className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-moss-600 hover:bg-moss-100 transition-colors"
                  title="恢复这份旧稿（当前内容会存入旧稿列表）"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> 恢复
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
