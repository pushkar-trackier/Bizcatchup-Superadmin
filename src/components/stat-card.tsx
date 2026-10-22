import { ArrowDownRight, ArrowRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  caption: string;
  loading?: boolean;
  /** Percent change vs the previous month; null when there is no baseline. */
  delta?: number | null;
}

/** Direction is carried by an arrow and a sign, never by color alone. */
function DeltaBadge({ delta }: { delta: number }) {
  const rounded = Math.round(delta * 10) / 10;
  const Icon = rounded > 0 ? ArrowUpRight : rounded < 0 ? ArrowDownRight : ArrowRight;
  const tone =
    rounded > 0 ? "text-emerald-600 dark:text-emerald-400" : rounded < 0 ? "text-destructive" : "text-muted-foreground";

  return (
    <div className={`mt-1 flex items-center gap-1 text-xs font-medium ${tone}`}>
      <Icon className="size-3.5" aria-hidden />
      <span className="tabular-nums">
        {rounded > 0 ? "+" : ""}
        {rounded}%
      </span>
      <span className="font-normal text-muted-foreground">vs last month</span>
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, caption, loading, delta }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-icon-tile text-icon-tile-foreground">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground">{label}</div>
          {loading ? (
            <Skeleton className="my-1 h-7 w-16" />
          ) : (
            <div className="text-2xl font-semibold tabular-nums">{value}</div>
          )}
          <div className="text-xs text-muted-foreground">{caption}</div>
          {!loading && delta !== null && delta !== undefined && <DeltaBadge delta={delta} />}
        </div>
      </CardContent>
    </Card>
  );
}
