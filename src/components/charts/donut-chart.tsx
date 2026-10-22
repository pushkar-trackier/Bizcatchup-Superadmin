"use client";

import { formatNumber } from "@/lib/format";

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
}

const SLOTS = ["--chart-1", "--chart-2", "--chart-3", "--chart-4"];

/**
 * Part-to-whole across the four plan types. Four categorical slots is the
 * documented cap for an adjacent-pair form, and at four, direct labels are
 * mandatory — the legend carries label + value + share for every slice, so
 * identity never rests on hue alone (two light-mode slots are under 3:1).
 *
 * A 2px surface gap separates touching segments instead of a stroke.
 */
export function DonutChart({ slices }: { slices: DonutSlice[] }) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const gap = 2;

  let offset = 0;

  return (
    <figure className="m-0 flex flex-wrap items-center justify-center gap-6">
      <div className="relative">
        <svg viewBox="0 0 160 160" className="size-40" role="img" aria-label="Teams by plan">
          <g transform="rotate(-90 80 80)">
            {total === 0 ? (
              <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--muted)" strokeWidth="20" />
            ) : (
              slices.map((s, i) => {
                const length = (s.value / total) * circumference;
                const dash = Math.max(length - gap, 0);
                const el = (
                  <circle
                    key={s.key}
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke={`var(${SLOTS[i % SLOTS.length]})`}
                    strokeWidth="20"
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={-offset}
                  >
                    <title>{`${s.label}: ${formatNumber(s.value)}`}</title>
                  </circle>
                );
                offset += length;
                return el;
              })
            )}
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-semibold tabular-nums">{formatNumber(total)}</div>
          <div className="text-xs text-muted-foreground">teams</div>
        </div>
      </div>

      <figcaption className="flex min-w-40 flex-col gap-2">
        {slices.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: `var(${SLOTS[i % SLOTS.length]})` }}
            />
            <span className="flex-1">{s.label}</span>
            <span className="tabular-nums">{formatNumber(s.value)}</span>
            <span className="w-10 text-right text-muted-foreground tabular-nums">
              {total === 0 ? "—" : `${Math.round((s.value / total) * 100)}%`}
            </span>
          </div>
        ))}
      </figcaption>
    </figure>
  );
}
