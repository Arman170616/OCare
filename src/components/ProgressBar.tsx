import { getProgressPercent, getRemainingAmount, formatOMR } from '@/lib/utils';
import { tr } from '@/lib/i18n';

interface ProgressBarProps {
  project: { target_amount: number; collected_amount: number };
  showLabels?: boolean;
}

export function ProgressBar({ project, showLabels = true }: ProgressBarProps) {
  const percent = getProgressPercent(project as any);
  const remaining = getRemainingAmount(project as any);

  return (
    <div className="w-full">
      {showLabels && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">
            {tr(`${formatOMR(project.collected_amount)} raised`, `تم جمع ${formatOMR(project.collected_amount)}`)}
          </span>
          <span className="text-slate-500">{percent}%</span>
        </div>
      )}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/70">
        <div
          className="h-full rounded-full bg-teal-600 transition-all duration-700 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabels && (
        <div className="mt-1 text-xs text-slate-500">
          {tr(
            `${formatOMR(remaining)} remaining of ${formatOMR(project.target_amount)}`,
            `متبقٍ ${formatOMR(remaining)} من ${formatOMR(project.target_amount)}`
          )}
        </div>
      )}
    </div>
  );
}
