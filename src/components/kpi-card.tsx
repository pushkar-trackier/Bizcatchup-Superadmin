import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type KpiTone = "good" | "bad" | "neutral";

const TONE_CLASS: Record<KpiTone, string> = {
  good: "bg-tone-good-bg text-tone-good-fg",
  bad: "bg-tone-bad-bg text-tone-bad-fg",
  neutral: "bg-tone-neutral-bg text-tone-neutral-fg",
};

export interface KpiCardProps {
  label: string;
  value: string;
  delta?: string;
  tone?: KpiTone;
  sub?: string;
  loading?: boolean;
}

/** The design's metric tile: label, large value, a tone pill, then a caption. */
export function KpiCard({ label, value, delta, tone = "neutral", sub, loading }: KpiCardProps) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[14px] border bg-card p-[18px]">
      <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
      {loading ? (
        <Skeleton className="h-9 w-20" />
      ) : (
        <span className="text-[30px] leading-tight font-[650] tracking-[-0.02em] tabular-nums">{value}</span>
      )}
      {!loading && delta && (
        <span className={cn("self-start rounded-md px-2 py-[3px] text-xs font-medium", TONE_CLASS[tone])}>{delta}</span>
      )}
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}
