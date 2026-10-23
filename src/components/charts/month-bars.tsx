"use client";

import { formatNumber } from "@/lib/format";

export interface MonthBar {
  key: string;
  label: string;
  value: number;
}

/**
 * The design labels every column rather than labelling selectively — with six
 * bars and no y-axis, the numbers above the bars are the only value channel,
 * so they stay. A zero renders as a 3px grey stub so an empty month is visibly
 * a month with no data, not a missing bar.
 */
export function MonthBars({ bars, color }: { bars: MonthBar[]; color: string }) {
  const max = Math.max(...bars.map((b) => b.value), 0);

  return (
    <>
      <div
        className="grid items-end gap-3.5 border-b pt-5"
        style={{ height: 200, gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))` }}
      >
        {bars.map((b) => {
          const height = b.value === 0 || max === 0 ? "3px" : `${Math.max(4, Math.round((b.value / max) * 100))}%`;
          return (
            <div key={b.key} className="flex h-full flex-col items-center justify-end gap-1.5">
              <span className="text-xs font-medium text-tone-neutral-fg tabular-nums">{formatNumber(b.value)}</span>
              <div
                className="w-full max-w-11 rounded-t-md"
                style={{ height, background: b.value === 0 ? "var(--input)" : color }}
              />
            </div>
          );
        })}
      </div>
      <div
        className="-mt-2 grid gap-3.5"
        style={{ gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))` }}
      >
        {bars.map((b) => (
          <span key={b.key} className="text-center text-xs text-muted-foreground">
            {b.label}
          </span>
        ))}
      </div>
    </>
  );
}
