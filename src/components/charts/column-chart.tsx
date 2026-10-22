"use client";

import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface ColumnPoint {
  key: string;
  label: string;
  value: number;
}

/** Clean axis ceiling (1/2/5 × 10^n) so ticks land on round numbers. */
function niceCeiling(max: number): number {
  if (max <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 5, 10].find((s) => max <= s * magnitude) ?? 10;
  return step * magnitude;
}

function compact(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K` : String(n);
}

/**
 * Single series, so one hue and no legend box — the card title names what is
 * plotted. Only the final column is direct-labelled; the rest are carried by
 * the axis and the hover tooltip.
 */
export function ColumnChart({
  points,
  colorVar = "--chart-1",
  valueLabel,
}: {
  points: ColumnPoint[];
  colorVar?: string;
  valueLabel: string;
}) {
  const max = niceCeiling(Math.max(...points.map((p) => p.value), 0));
  const ticks = [max, max / 2, 0];
  const color = `var(${colorVar})`;

  return (
    <figure className="m-0">
      <div className="flex gap-3">
        <div className="flex w-10 shrink-0 flex-col justify-between py-0 text-right text-xs text-muted-foreground tabular-nums">
          {ticks.map((t) => (
            <span key={t} className="leading-none">
              {compact(t)}
            </span>
          ))}
        </div>

        <div className="relative flex-1">
          {/* Hairline, solid, one step off surface — recessive. */}
          {ticks.map((t) => (
            <div
              key={t}
              aria-hidden
              className="absolute inset-x-0 border-t border-border"
              style={{ top: `${((max - t) / max) * 100}%` }}
            />
          ))}

          <div className="relative flex h-40 items-end gap-2">
            {points.map((p, i) => {
              const pct = max === 0 ? 0 : (p.value / max) * 100;
              const isLast = i === points.length - 1;
              return (
                <div key={p.key} className="group relative flex h-full flex-1 flex-col justify-end">
                  {isLast && p.value > 0 && (
                    <div className="mb-1 text-center text-xs font-medium tabular-nums">{formatNumber(p.value)}</div>
                  )}
                  <div
                    className={cn(
                      "mx-auto w-full max-w-6 rounded-t transition-opacity group-hover:opacity-80",
                      p.value === 0 && "min-h-px",
                    )}
                    style={{ height: `${pct}%`, backgroundColor: color }}
                  />
                  {/* Hit target spans the whole band, not just the 24px mark. */}
                  <div className="absolute inset-0" />
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-md border bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground shadow-md group-hover:block">
                    <span className="font-medium">{p.label}</span>
                    <span className="text-muted-foreground"> · </span>
                    <span className="tabular-nums">
                      {formatNumber(p.value)} {valueLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-2 flex gap-2">
            {points.map((p) => (
              <div key={p.key} className="flex-1 text-center text-xs text-muted-foreground">
                {p.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </figure>
  );
}
